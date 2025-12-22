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
    const ENoTicket: u64 = 1;
    const EAlreadyHasCertificate: u64 = 2;
    const ENotProfileOwner: u64 = 3;

    // === Structs ===

    /// Teacher Profile - Contains instructor information
    /// Owned by the teacher and reused across courses
    public struct TeacherProfile has key, store {
        id: UID,
        owner: address,
        avatar_blob_id: String, // Profile picture on Walrus
        about: String, // About the teacher
        contacts: String, // Contact information (email, social media, etc.)
    }

    /// Represents an online course as a Shared Object
    /// This can be accessed and enrolled in by anyone
    public struct Course has key, store {
        id: UID,
        instructor: address,
        instructor_profile_id: ID, // Reference to TeacherProfile
        title: String,
        description: String,
        price: u64,
        thumbnail_blob_id: String, // Thumbnail image on Walrus
        course_data_blob_id: String, // JSON with modules, materials, test questions on Walrus
    }

    /// Course Ticket - Proof of purchase, allows access to course content
    /// Can be transferred until converted to certificate
    public struct CourseTicket has key, store {
        id: UID,
        course_id: ID,
        student_address: address,
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
        student_name: String,
        test_score: u64, // Percentage score (0-100)
        completion_date: u64, // Timestamp
    }

    // === Events ===

    /// Emitted when a teacher profile is created
    public struct ProfileCreated has copy, drop {
        profile_id: ID,
        owner: address,
    }

    /// Emitted when a teacher profile is updated
    public struct ProfileUpdated has copy, drop {
        profile_id: ID,
        owner: address,
    }

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

    /// Emitted when a student completes a course and earns certificate
    public struct CertificateIssued has copy, drop {
        course_id: ID,
        student: address,
        student_name: String,
        test_score: u64,
    }

    // === Public Functions ===

    /// Creates a teacher profile
    /// This should be done once before creating the first course
    /// 
    /// # Arguments
    /// * `avatar_blob_id` - Reference to profile picture on Walrus
    /// * `about` - Information about the teacher
    /// * `contacts` - Contact information (email, social media, etc.)
    /// * `ctx` - Transaction context (provides sender address)
    public entry fun create_teacher_profile(
        avatar_blob_id: String,
        about: String,
        contacts: String,
        ctx: &mut TxContext,
    ) {
        let profile_id = object::new(ctx);
        let profile_id_copy = object::uid_to_inner(&profile_id);

        let profile = TeacherProfile {
            id: profile_id,
            owner: ctx.sender(),
            avatar_blob_id,
            about,
            contacts,
        };

        // Emit profile creation event
        event::emit(ProfileCreated {
            profile_id: profile_id_copy,
            owner: ctx.sender(),
        });

        // Transfer profile to teacher
        transfer::public_transfer(profile, ctx.sender());
    }

    /// Updates a teacher profile
    /// Only the profile owner can update it
    /// 
    /// # Arguments
    /// * `profile` - Mutable reference to the profile
    /// * `avatar_blob_id` - New profile picture on Walrus
    /// * `about` - Updated information about the teacher
    /// * `contacts` - Updated contact information
    /// * `ctx` - Transaction context
    /// 
    /// # Panics
    /// Aborts with `ENotProfileOwner` if caller is not the profile owner
    public entry fun update_teacher_profile(
        profile: &mut TeacherProfile,
        avatar_blob_id: String,
        about: String,
        contacts: String,
        ctx: &mut TxContext,
    ) {
        // Verify caller is the profile owner
        assert!(profile.owner == ctx.sender(), ENotProfileOwner);

        // Update profile fields
        profile.avatar_blob_id = avatar_blob_id;
        profile.about = about;
        profile.contacts = contacts;

        // Emit profile update event
        event::emit(ProfileUpdated {
            profile_id: object::uid_to_inner(&profile.id),
            owner: ctx.sender(),
        });
    }

    /// Creates a new course and shares it for public access
    /// Requires a teacher profile to be created first
    /// 
    /// # Arguments
    /// * `profile` - Reference to teacher's profile
    /// * `title` - The course title
    /// * `description` - Detailed course description
    /// * `price` - Enrollment price in MIST (1 SUI = 1_000_000_000 MIST)
    /// * `thumbnail_blob_id` - Reference to course thumbnail on Walrus
    /// * `course_data_blob_id` - Reference to course data JSON on Walrus (modules, materials, tests)
    /// * `ctx` - Transaction context (provides sender address)
    public entry fun create_course(
        profile: &TeacherProfile,
        title: String,
        description: String,
        price: u64,
        thumbnail_blob_id: String,
        course_data_blob_id: String,
        ctx: &mut TxContext,
    ) {
        // Verify caller owns the profile
        assert!(profile.owner == ctx.sender(), ENotProfileOwner);

        let course_id = object::new(ctx);
        let course_id_copy = object::uid_to_inner(&course_id);

        let course = Course {
            id: course_id,
            instructor: ctx.sender(),
            instructor_profile_id: object::uid_to_inner(&profile.id),
            title,
            description,
            price,
            thumbnail_blob_id,
            course_data_blob_id,
        };

        // Emit course creation event
        event::emit(CourseCreated {
            course_id: course_id_copy,
            instructor: ctx.sender(),
        });

        // Share the course object so anyone can enroll
        transfer::share_object(course);
    }

    /// Enrolls a student in a course by processing payment and issuing a ticket
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

        // Create the course ticket (grants access to course)
        let ticket_id = object::new(ctx);
        let ticket = CourseTicket {
            id: ticket_id,
            course_id: object::id(course),
            student_address: ctx.sender(),
        };

        // Emit enrollment event
        event::emit(CoursePurchased {
            course_id: object::id(course),
            student: ctx.sender(),
        });

        // Transfer ticket to student
        transfer::public_transfer(ticket, ctx.sender());
    }

    /// Issue a certificate after student passes the final test
    /// Consumes the course ticket and creates a soulbound certificate
    /// 
    /// # Arguments
    /// * `ticket` - The course ticket (proof of purchase)
    /// * `student_name` - The student's name for the certificate
    /// * `test_score` - The test score percentage (0-100)
    /// * `ctx` - Transaction context
    public entry fun issue_certificate(
        ticket: CourseTicket,
        student_name: String,
        test_score: u64,
        ctx: &mut TxContext,
    ) {
        let CourseTicket { id: ticket_id, course_id, student_address: _ } = ticket;
        
        // Delete the ticket
        object::delete(ticket_id);

        // Create the soulbound certificate
        let certificate_id = object::new(ctx);
        let certificate = CourseCertificate {
            id: certificate_id,
            course_id,
            student_address: ctx.sender(),
            student_name,
            test_score,
            completion_date: tx_context::epoch(ctx),
        };

        // Emit certificate event
        event::emit(CertificateIssued {
            course_id,
            student: ctx.sender(),
            student_name,
            test_score,
        });

        // Transfer certificate to student
        // Note: Due to lacking `store` capability, this certificate cannot be
        // transferred again - it's permanently bound to the student's address
        transfer::transfer(certificate, ctx.sender());
    }

    // === View Functions ===

    /// Returns the profile owner
    public fun get_profile_owner(profile: &TeacherProfile): address {
        profile.owner
    }

    /// Returns the Walrus blob ID for profile avatar
    public fun get_profile_avatar_blob_id(profile: &TeacherProfile): String {
        profile.avatar_blob_id
    }

    /// Returns the about section of the profile
    public fun get_profile_about(profile: &TeacherProfile): String {
        profile.about
    }

    /// Returns the contacts from the profile
    public fun get_profile_contacts(profile: &TeacherProfile): String {
        profile.contacts
    }

    /// Returns the instructor profile ID for a course
    public fun get_instructor_profile_id(course: &Course): ID {
        course.instructor_profile_id
    }

    /// Returns the course price
    public fun get_price(course: &Course): u64 {
        course.price
    }

    /// Returns the course instructor
    public fun get_instructor(course: &Course): address {
        course.instructor
    }

    /// Returns the Walrus blob ID for course thumbnail
    public fun get_thumbnail_blob_id(course: &Course): String {
        course.thumbnail_blob_id
    }

    /// Returns the Walrus blob ID for course data
    public fun get_course_data_blob_id(course: &Course): String {
        course.course_data_blob_id
    }
}

