#[test_only]
module suicert::academy_tests {
    use suicert::academy::{Self, Course, CourseCertificate, CourseTicket, TeacherProfile};
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::test_utils;
    use std::string;

    // Test addresses
    const INSTRUCTOR: address = @0xA;
    const STUDENT1: address = @0xB;
    const STUDENT2: address = @0xC;

    // Test constants
    const COURSE_PRICE: u64 = 1_000_000_000; // 1 SUI
    const INITIAL_BALANCE: u64 = 10_000_000_000; // 10 SUI

    // Error codes
    const EInsufficientPayment: u64 = 0;
    const ENotProfileOwner: u64 = 3;

    // === Helper Functions ===

    fun create_teacher_profile(scenario: &mut Scenario) {
        ts::next_tx(scenario, INSTRUCTOR);
        {
            academy::create_teacher_profile(
                string::utf8(b"walrus://avatar123"),
                string::utf8(b"Experienced blockchain developer with 5+ years in Move"),
                string::utf8(b"email@example.com, twitter.com/teacher"),
                ts::ctx(scenario),
            );
        };
    }

    fun create_test_course(scenario: &mut Scenario) {
        // First create teacher profile
        create_teacher_profile(scenario);
        
        // Then create course
        ts::next_tx(scenario, INSTRUCTOR);
        {
            let profile = ts::take_from_sender<TeacherProfile>(scenario);
            academy::create_course(
                &profile,
                string::utf8(b"Sui Move Masterclass"),
                string::utf8(b"Learn advanced Move programming on Sui"),
                COURSE_PRICE,
                string::utf8(b"walrus://blob123456"),
                string::utf8(b"walrus://coursedata789"),
                ts::ctx(scenario),
            );
            ts::return_to_sender(scenario, profile);
        };
    }

    fun mint_sui_for_testing(scenario: &mut Scenario, recipient: address, amount: u64) {
        ts::next_tx(scenario, recipient);
        {
            let coin = coin::mint_for_testing<SUI>(amount, ts::ctx(scenario));
            transfer::public_transfer(coin, recipient);
        };
    }

    // === Tests ===

    #[test]
    fun test_create_course_success() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create a course
        create_test_course(&mut scenario);

        // Verify the course was created and shared
        ts::next_tx(&mut scenario, INSTRUCTOR);
        {
            let course = ts::take_shared<Course>(&scenario);
            
            assert!(academy::get_price(&course) == COURSE_PRICE, 0);
            assert!(academy::get_instructor(&course) == INSTRUCTOR, 1);
            assert!(academy::get_thumbnail_blob_id(&course) == string::utf8(b"walrus://blob123456"), 2);
            assert!(academy::get_course_data_blob_id(&course) == string::utf8(b"walrus://coursedata789"), 3);
            
            ts::return_shared(course);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_enroll_with_exact_payment() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create a course
        create_test_course(&mut scenario);

        // Student enrolls with exact payment
        ts::next_tx(&mut scenario, STUDENT1);
        {
            let mut course = ts::take_shared<Course>(&scenario);
            let mut payment = coin::mint_for_testing<SUI>(COURSE_PRICE, ts::ctx(&mut scenario));
            
            academy::enroll(&course, &mut payment, ts::ctx(&mut scenario));
            
            // Payment should be empty now (all taken)
            assert!(coin::value(&payment) == 0, 0);
            
            coin::destroy_zero(payment);
            ts::return_shared(course);
        };

        // Verify ticket was issued to student
        ts::next_tx(&mut scenario, STUDENT1);
        {
            assert!(ts::has_most_recent_for_address<CourseTicket>(STUDENT1), 1);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_enroll_with_excess_payment() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create a course
        create_test_course(&mut scenario);

        // Student enrolls with more than required payment
        ts::next_tx(&mut scenario, STUDENT1);
        {
            let course = ts::take_shared<Course>(&scenario);
            let mut payment = coin::mint_for_testing<SUI>(INITIAL_BALANCE, ts::ctx(&mut scenario));
            
            academy::enroll(&course, &mut payment, ts::ctx(&mut scenario));
            
            // Payment should have the remaining balance
            assert!(coin::value(&payment) == INITIAL_BALANCE - COURSE_PRICE, 0);
            
            coin::burn_for_testing(payment);
            ts::return_shared(course);
        };

        // Verify ticket was issued
        ts::next_tx(&mut scenario, STUDENT1);
        {
            assert!(ts::has_most_recent_for_address<CourseTicket>(STUDENT1), 1);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = suicert::academy::EInsufficientPayment)]
    fun test_enroll_with_insufficient_payment() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create a course
        create_test_course(&mut scenario);

        // Student tries to enroll with insufficient payment
        ts::next_tx(&mut scenario, STUDENT1);
        {
            let course = ts::take_shared<Course>(&scenario);
            let mut payment = coin::mint_for_testing<SUI>(COURSE_PRICE - 1, ts::ctx(&mut scenario));
            
            // This should abort with EInsufficientPayment
            academy::enroll(&course, &mut payment, ts::ctx(&mut scenario));
            
            coin::burn_for_testing(payment);
            ts::return_shared(course);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_multiple_students_can_enroll() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create a course
        create_test_course(&mut scenario);

        // Student 1 enrolls
        ts::next_tx(&mut scenario, STUDENT1);
        {
            let course = ts::take_shared<Course>(&scenario);
            let mut payment = coin::mint_for_testing<SUI>(COURSE_PRICE, ts::ctx(&mut scenario));
            
            academy::enroll(&course, &mut payment, ts::ctx(&mut scenario));
            
            coin::destroy_zero(payment);
            ts::return_shared(course);
        };

        // Student 2 enrolls
        ts::next_tx(&mut scenario, STUDENT2);
        {
            let course = ts::take_shared<Course>(&scenario);
            let mut payment = coin::mint_for_testing<SUI>(COURSE_PRICE, ts::ctx(&mut scenario));
            
            academy::enroll(&course, &mut payment, ts::ctx(&mut scenario));
            
            coin::destroy_zero(payment);
            ts::return_shared(course);
        };

        // Verify both students have tickets
        ts::next_tx(&mut scenario, STUDENT1);
        {
            assert!(ts::has_most_recent_for_address<CourseTicket>(STUDENT1), 0);
        };

        ts::next_tx(&mut scenario, STUDENT2);
        {
            assert!(ts::has_most_recent_for_address<CourseTicket>(STUDENT2), 1);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_instructor_receives_payment() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create a course
        create_test_course(&mut scenario);

        // Student enrolls
        ts::next_tx(&mut scenario, STUDENT1);
        {
            let course = ts::take_shared<Course>(&scenario);
            let mut payment = coin::mint_for_testing<SUI>(COURSE_PRICE, ts::ctx(&mut scenario));
            
            academy::enroll(&course, &mut payment, ts::ctx(&mut scenario));
            
            coin::destroy_zero(payment);
            ts::return_shared(course);
        };

        // Verify instructor received the payment
        ts::next_tx(&mut scenario, INSTRUCTOR);
        {
            let payment_coin = ts::take_from_address<Coin<SUI>>(&scenario, INSTRUCTOR);
            assert!(coin::value(&payment_coin) == COURSE_PRICE, 0);
            ts::return_to_address(INSTRUCTOR, payment_coin);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_instructor_receives_multiple_payments() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create a course
        create_test_course(&mut scenario);

        // Student 1 enrolls
        ts::next_tx(&mut scenario, STUDENT1);
        {
            let course = ts::take_shared<Course>(&scenario);
            let mut payment = coin::mint_for_testing<SUI>(COURSE_PRICE, ts::ctx(&mut scenario));
            academy::enroll(&course, &mut payment, ts::ctx(&mut scenario));
            coin::destroy_zero(payment);
            ts::return_shared(course);
        };

        // Student 2 enrolls
        ts::next_tx(&mut scenario, STUDENT2);
        {
            let course = ts::take_shared<Course>(&scenario);
            let mut payment = coin::mint_for_testing<SUI>(COURSE_PRICE, ts::ctx(&mut scenario));
            academy::enroll(&course, &mut payment, ts::ctx(&mut scenario));
            coin::destroy_zero(payment);
            ts::return_shared(course);
        };

        // Verify instructor received BOTH payments (2 x COURSE_PRICE)
        ts::next_tx(&mut scenario, INSTRUCTOR);
        {
            // Instructor should have 2 coin objects
            let payment_coin1 = ts::take_from_address<Coin<SUI>>(&scenario, INSTRUCTOR);
            assert!(coin::value(&payment_coin1) == COURSE_PRICE, 0);
            
            let payment_coin2 = ts::take_from_address<Coin<SUI>>(&scenario, INSTRUCTOR);
            assert!(coin::value(&payment_coin2) == COURSE_PRICE, 1);
            
            ts::return_to_address(INSTRUCTOR, payment_coin1);
            ts::return_to_address(INSTRUCTOR, payment_coin2);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_free_course() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create teacher profile first
        create_teacher_profile(&mut scenario);

        // Create a free course (price = 0)
        ts::next_tx(&mut scenario, INSTRUCTOR);
        {
            let profile = ts::take_from_sender<TeacherProfile>(&scenario);
            academy::create_course(
                &profile,
                string::utf8(b"Free Introduction Course"),
                string::utf8(b"A free course for beginners"),
                0, // Free course
                string::utf8(b"walrus://free_blob"),
                string::utf8(b"walrus://free_coursedata"),
                ts::ctx(&mut scenario),
            );
            ts::return_to_sender(&scenario, profile);
        };

        // Student enrolls with zero payment
        ts::next_tx(&mut scenario, STUDENT1);
        {
            let course = ts::take_shared<Course>(&scenario);
            let mut payment = coin::mint_for_testing<SUI>(0, ts::ctx(&mut scenario));
            
            academy::enroll(&course, &mut payment, ts::ctx(&mut scenario));
            
            coin::destroy_zero(payment);
            ts::return_shared(course);
        };

        // Verify ticket was issued
        ts::next_tx(&mut scenario, STUDENT1);
        {
            assert!(ts::has_most_recent_for_address<CourseTicket>(STUDENT1), 0);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_view_functions() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create a course
        create_test_course(&mut scenario);

        // Test all view functions
        ts::next_tx(&mut scenario, STUDENT1);
        {
            let course = ts::take_shared<Course>(&scenario);
            
            // Verify all getters work correctly
            assert!(academy::get_price(&course) == COURSE_PRICE, 0);
            assert!(academy::get_instructor(&course) == INSTRUCTOR, 1);
            assert!(
                academy::get_thumbnail_blob_id(&course) == string::utf8(b"walrus://blob123456"), 
                2
            );
            assert!(
                academy::get_course_data_blob_id(&course) == string::utf8(b"walrus://coursedata789"),
                3
            );
            
            ts::return_shared(course);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_create_teacher_profile() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create teacher profile
        create_teacher_profile(&mut scenario);

        // Verify profile was created and transferred to instructor
        ts::next_tx(&mut scenario, INSTRUCTOR);
        {
            let profile = ts::take_from_sender<TeacherProfile>(&scenario);
            
            assert!(academy::get_profile_owner(&profile) == INSTRUCTOR, 0);
            assert!(academy::get_profile_avatar_blob_id(&profile) == string::utf8(b"walrus://avatar123"), 1);
            assert!(academy::get_profile_about(&profile) == string::utf8(b"Experienced blockchain developer with 5+ years in Move"), 2);
            assert!(academy::get_profile_contacts(&profile) == string::utf8(b"email@example.com, twitter.com/teacher"), 3);
            
            ts::return_to_sender(&scenario, profile);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_update_teacher_profile() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create teacher profile
        create_teacher_profile(&mut scenario);

        // Update profile
        ts::next_tx(&mut scenario, INSTRUCTOR);
        {
            let mut profile = ts::take_from_sender<TeacherProfile>(&scenario);
            
            academy::update_teacher_profile(
                &mut profile,
                string::utf8(b"walrus://avatar456"),
                string::utf8(b"Updated: Expert in Move and Rust"),
                string::utf8(b"newemail@example.com, linkedin.com/teacher"),
                ts::ctx(&mut scenario),
            );
            
            // Verify updates
            assert!(academy::get_profile_avatar_blob_id(&profile) == string::utf8(b"walrus://avatar456"), 0);
            assert!(academy::get_profile_about(&profile) == string::utf8(b"Updated: Expert in Move and Rust"), 1);
            assert!(academy::get_profile_contacts(&profile) == string::utf8(b"newemail@example.com, linkedin.com/teacher"), 2);
            
            ts::return_to_sender(&scenario, profile);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = suicert::academy::ENotProfileOwner)]
    fun test_update_profile_not_owner() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create teacher profile
        create_teacher_profile(&mut scenario);

        // Try to update profile from different address
        ts::next_tx(&mut scenario, STUDENT1);
        {
            let mut profile = ts::take_from_address<TeacherProfile>(&scenario, INSTRUCTOR);
            
            // This should abort with ENotProfileOwner
            academy::update_teacher_profile(
                &mut profile,
                string::utf8(b"walrus://hacked"),
                string::utf8(b"Hacked"),
                string::utf8(b"hacker@evil.com"),
                ts::ctx(&mut scenario),
            );
            
            ts::return_to_address(INSTRUCTOR, profile);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_course_references_profile() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create course with profile
        create_test_course(&mut scenario);

        // Verify course references the profile
        ts::next_tx(&mut scenario, INSTRUCTOR);
        {
            let course = ts::take_shared<Course>(&scenario);
            let profile = ts::take_from_sender<TeacherProfile>(&scenario);
            
            // Course should reference the profile
            let profile_id = object::id(&profile);
            assert!(academy::get_instructor_profile_id(&course) == profile_id, 0);
            
            ts::return_shared(course);
            ts::return_to_sender(&scenario, profile);
        };

        ts::end(scenario);
    }
}
