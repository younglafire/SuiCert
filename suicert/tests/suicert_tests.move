#[test_only]
module suicert::academy_tests {
    use suicert::academy::{Self, Course, CourseCertificate};
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string;

    // Test addresses
    const INSTRUCTOR: address = @0xA;
    const STUDENT1: address = @0xB;
    const STUDENT2: address = @0xC;

    // Test constants
    const COURSE_PRICE: u64 = 1_000_000_000; // 1 SUI
    const INITIAL_BALANCE: u64 = 10_000_000_000; // 10 SUI

    // === Helper Functions ===

    fun create_test_course(scenario: &mut Scenario) {
        ts::next_tx(scenario, INSTRUCTOR);
        {
            academy::create_course(
                string::utf8(b"Sui Move Masterclass"),
                string::utf8(b"Learn advanced Move programming on Sui"),
                COURSE_PRICE,
                string::utf8(b"walrus://blob123456"),
                ts::ctx(scenario),
            );
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
            assert!(academy::get_walrus_blob_id(&course) == string::utf8(b"walrus://blob123456"), 2);
            
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

        // Verify certificate was minted to student
        ts::next_tx(&mut scenario, STUDENT1);
        {
            assert!(ts::has_most_recent_for_address<CourseCertificate>(STUDENT1), 1);
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

        // Verify certificate was minted
        ts::next_tx(&mut scenario, STUDENT1);
        {
            assert!(ts::has_most_recent_for_address<CourseCertificate>(STUDENT1), 1);
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

        // Verify both students have certificates
        ts::next_tx(&mut scenario, STUDENT1);
        {
            assert!(ts::has_most_recent_for_address<CourseCertificate>(STUDENT1), 0);
        };

        ts::next_tx(&mut scenario, STUDENT2);
        {
            assert!(ts::has_most_recent_for_address<CourseCertificate>(STUDENT2), 1);
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
    fun test_free_course() {
        let mut scenario = ts::begin(INSTRUCTOR);
        
        // Create a free course (price = 0)
        ts::next_tx(&mut scenario, INSTRUCTOR);
        {
            academy::create_course(
                string::utf8(b"Free Introduction Course"),
                string::utf8(b"A free course for beginners"),
                0, // Free course
                string::utf8(b"walrus://free_blob"),
                ts::ctx(&mut scenario),
            );
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

        // Verify certificate was minted
        ts::next_tx(&mut scenario, STUDENT1);
        {
            assert!(ts::has_most_recent_for_address<CourseCertificate>(STUDENT1), 0);
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
                academy::get_walrus_blob_id(&course) == string::utf8(b"walrus://blob123456"), 
                2
            );
            
            ts::return_shared(course);
        };

        ts::end(scenario);
    }
}
