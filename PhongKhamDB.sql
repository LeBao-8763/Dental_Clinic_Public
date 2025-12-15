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
    username VARCHAR(100) UNIQUE,
    avatar VARCHAR(255),
    password VARCHAR(255),
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    role ENUM('ROLE_ADMIN', 'ROLE_DENTIST', 'ROLE_STAFF', 'ROLE_PATIENT'),
    status ENUM('ACTIVE', 'INACTIVE'),
    FOREIGN KEY (specialization_id) REFERENCES specialization(id)
);

-- Bảng thông tin bác sĩ
CREATE TABLE dentist_profile (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dentist_id BIGINT,
    
	introduction TEXT,
    education TEXT,
    experience TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dentist_id) REFERENCES user(id)
);


-- Bảng thuốc
CREATE TABLE medicine (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    reserved_quantity INT, -- Trừ tạm khi kê đơn chưa thanh toán
    type ENUM('PILL', 'CREAM', 'LIQUID', 'OTHER'),
    amount_per_unit INT,
    retail_unit VARCHAR(50),
    selling_price DECIMAL(10,2)
);

-- Bảng nhập thuốc
CREATE TABLE medicine_import (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    medicine_id BIGINT,
    import_date DATETIME DEFAULT CURRENT_TIMESTAMP,
	production_date DATETIME,
    expiration_date DATETIME,
    quantity_imported INT,
    price DECIMAL(10,2),
    stock_quantity INT, -- số lượng còn lại trong lô này
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
    
    effective_from DATE, -- ngày bắt đầu áp dụng
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (dentist_id) REFERENCES user(id)
);

-- Bảng ngoại lệ (bác sĩ xin nghỉ, bận đột xuất,...)
CREATE TABLE dentist_custom_schedule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dentist_id BIGINT NOT NULL,
    custom_date DATE NOT NULL,
    is_day_off BOOLEAN DEFAULT FALSE,   -- <== thêm cái này
    start_time TIME NULL,
    end_time TIME NULL,
    note VARCHAR(255),
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
    diagnosis TEXT,
    status ENUM('PENDING', 'CONSULTING','PRESCRIPTION', 'CANCELLED', 'COMPLETED'),
    FOREIGN KEY (dentist_id) REFERENCES user(id),
    FOREIGN KEY (patient_id) REFERENCES user(id)
);

-- Bảng tracking việc hủy đặt lịch trên một ngày của khách hàng
CREATE TABLE user_booking_stats(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    cancel_count_day INT DEFAULT 0, 
    last_cancel_at DATETIME,
    blocked_until DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user(id)
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
    appointment_id BIGINT NOT NULL,
    note VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('DRAFT', 'CONFIRMED', 'CANCELLED'),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Bảng chi tiết toa thuốc
CREATE TABLE prescription_details (
    prescription_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    dosage INT,
    unit VARCHAR(50),
    duration_days INT,
    note VARCHAR(255),
    price DECIMAL(10,2),
    PRIMARY KEY (prescription_id, medicine_id),
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
    FOREIGN KEY (medicine_id) REFERENCES medicine(id)
);

-- Bảng hóa đơn
CREATE TABLE invoice (
    appointment_id BIGINT PRIMARY KEY,  -- Khóa chính cũng là khóa ngoại
    total_service_fee DECIMAL(10,2) DEFAULT 0,
    total_medicine_fee DECIMAL(10,2) DEFAULT 0,
    vat DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Bảng các thông tin liên quan đến nha khoa
CREATE TABLE post (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    img TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
