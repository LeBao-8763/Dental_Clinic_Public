CREATE DATABASE dental_clinic;
USE dental_clinic;

-- Bảng chuyên ngành
CREATE TABLE specialization (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    description VARCHAR(255)
);

-- Bảng người dùng (bác sĩ, bệnh nhân, nhân viên)
CREATE TABLE user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    specialization_id BIGINT NULL,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    phone_number VARCHAR(20) UNIQUE,
    address VARCHAR(255) ,
    username VARCHAR(100) UNIQUE,
    avatar VARCHAR(255),
    password VARCHAR(255),
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    role ENUM('ROLE_ADMIN', 'ROLE_DENTIST', 'ROLE_STAFF', 'ROLE_PATIENT'),
    status ENUM('ACTIVE', 'INACTIVE'),
    FOREIGN KEY (specialization_id) REFERENCES specialization(id)
);


-- Bảng thuốc
CREATE TABLE medicine (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    production_date DATETIME,
    expiration_date DATETIME,
    stock_quantity INT,
    type ENUM('PILL', 'CREAM', 'LIQUID', 'OTHER'),
    amount_per_unit INT,
    retail_unit VARCHAR(50)
);

-- Bảng nhập thuốc
CREATE TABLE medicine_import (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    medicine_id BIGINT,
    import_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    quantity_imported INT,
    price DECIMAL(10,2),
    stock_quantity INT,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (medicine_id) REFERENCES medicine(id)
);

-- Bảng giờ hoạt động chung của phòng khám (do admin cấu hình)
CREATE TABLE clinic_hours (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    day_of_week ENUM(
        'MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'
    ) NOT NULL,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    slot_duration_minutes INT DEFAULT 30
);


-- Bảng lịch làm việc của bác sĩ (bác sĩ chọn khung giờ mình làm)
-- Lưu các khoảng giờ liên tục, không lưu từng slot nhỏ
CREATE TABLE dentist_schedule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dentist_id BIGINT NOT NULL,
    day_of_week ENUM(
        'MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'
    ) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (dentist_id) REFERENCES user(id)
);

-- Bảng ngoại lệ (bác sĩ xin nghỉ, bận đột xuất,...)
CREATE TABLE dentist_schedule_exception (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dentist_id BIGINT NOT NULL,
    exception_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason VARCHAR(255),
    FOREIGN KEY (dentist_id) REFERENCES user(id)
);

-- Bảng lịch hẹn (khi bệnh nhân đặt slot cụ thể)
CREATE TABLE appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dentist_id BIGINT,
    patient_id BIGINT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    note VARCHAR(255),
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'),
    FOREIGN KEY (dentist_id) REFERENCES user(id),
    FOREIGN KEY (patient_id) REFERENCES user(id)
);

-- Bảng dịch vụ
CREATE TABLE service (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    price DECIMAL(10,2),
    description VARCHAR(255)
);

-- Bảng hồ sơ điều trị
CREATE TABLE treatment_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT,
    service_id BIGINT,
    price DECIMAL(10,2),
    note VARCHAR(255),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (service_id) REFERENCES service(id)
);

-- Bảng toa thuốc
CREATE TABLE prescriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT,
    medicine_id BIGINT,
    dosage INT,
    unit VARCHAR(50),
    duration_days INT,
    note VARCHAR(255),
    price DECIMAL(10,2),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (medicine_id) REFERENCES medicine(id)
);

-- Bảng hóa đơn
CREATE TABLE invoice (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT,
    total_service_fee DECIMAL(10,2),
    total_medicine_fee DECIMAL(10,2),
    vat DECIMAL(10,2),
    total DECIMAL(10,2),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);
