/// Module: academy
/// A decentralized online course platform with soulbound certificates
module suicert::academy {
    // === Imports ===
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use std::string::String;

    // === Errors ===
    const EInsufficientPayment: u64 = 0;

    // === Structs ===

    /// Represents an online course as a Shared Object
    /// This can be accessed and enrolled in by anyone
    public struct Course has key, store {
        id: UID,
        instructor: address,
        title: String,
        description: String,
        price: u64,
        walrus_blob_id: String, // Decentralized storage reference
    }

    /// Soulbound Certificate - Non-transferable proof of course completion
    /// 
    /// SOULBOUND MECHANISM:
    /// This struct has ONLY the `key` capability, deliberately missing `store`.
    /// - `key`: Allows the object to be owned and have a unique ID
    /// - NO `store`: Prevents the object from being transferred, wrapped in other objects,
    ///   or placed in dynamic fields/tables
    /// 
    /// This makes the certificate permanently bound to the student's address,
    /// preventing secondary markets and ensuring authentic proof of learning.
    public struct CourseCertificate has key {
        id: UID,
        course_id: ID,
        student_address: address,
    }

    // === Events ===

    /// Emitted when a new course is created
    public struct CourseCreated has copy, drop {
        course_id: ID,
        instructor: address,
    }

    /// Emitted when a student enrolls in a course
    public struct CoursePurchased has copy, drop {
        course_id: ID,
        student: address,
    }

    // === Public Functions ===

    /// Creates a new course and shares it for public access
    /// 
    /// # Arguments
    /// * `title` - The course title
    /// * `description` - Detailed course description
    /// * `price` - Enrollment price in MIST (1 SUI = 1_000_000_000 MIST)
    /// * `walrus_blob_id` - Reference to course content stored on Walrus
    /// * `ctx` - Transaction context (provides sender address)
    public entry fun create_course(
        title: String,
        description: String,
        price: u64,
        walrus_blob_id: String,
        ctx: &mut TxContext,
    ) {
        let course_id = object::new(ctx);
        let course_id_copy = object::uid_to_inner(&course_id);

        let course = Course {
            id: course_id,
            instructor: ctx.sender(),
            title,
            description,
            price,
            walrus_blob_id,
        };

        // Emit course creation event
        event::emit(CourseCreated {
            course_id: course_id_copy,
            instructor: ctx.sender(),
        });

        // Share the course object so anyone can enroll
        transfer::share_object(course);
    }

    /// Enrolls a student in a course by processing payment and minting a certificate
    /// 
    /// # Arguments
    /// * `course` - Reference to the course to enroll in
    /// * `payment` - Mutable coin containing payment (must have >= course.price)
    /// * `ctx` - Transaction context
    /// 
    /// # Panics
    /// Aborts with `EInsufficientPayment` if payment is less than course price
    public entry fun enroll(
        course: &Course,
        payment: &mut Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        // Verify sufficient payment
        assert!(coin::value(payment) >= course.price, EInsufficientPayment);

        // Split the exact payment amount from the provided coin
        let payment_coin = coin::split(payment, course.price, ctx);

        // Transfer payment to the instructor
        transfer::public_transfer(payment_coin, course.instructor);

        // Create the soulbound certificate
        let certificate_id = object::new(ctx);
        let certificate = CourseCertificate {
            id: certificate_id,
            course_id: object::id(course),
            student_address: ctx.sender(),
        };

        // Emit enrollment event
        event::emit(CoursePurchased {
            course_id: object::id(course),
            student: ctx.sender(),
        });

        // Transfer certificate to student
        // Note: Due to lacking `store` capability, this certificate cannot be
        // transferred again - it's permanently bound to the student's address
        transfer::transfer(certificate, ctx.sender());
    }

    // === View Functions ===

    /// Returns the course price
    public fun get_price(course: &Course): u64 {
        course.price
    }

    /// Returns the course instructor
    public fun get_instructor(course: &Course): address {
        course.instructor
    }

    /// Returns the Walrus blob ID for course content
    public fun get_walrus_blob_id(course: &Course): String {
        course.walrus_blob_id
    }
}


