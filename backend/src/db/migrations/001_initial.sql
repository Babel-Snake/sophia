-- Core tables for Sophia MVP
-- All IDs are UUID v4, pre-generated in Node

-- Organizations
CREATE TABLE orgs (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  display_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email (email)
);

-- Org membership
CREATE TABLE org_members (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('admin', 'supervisor', 'mentor', 'student') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_org_user (org_id, user_id)
);

-- Login identities (for Firebase UID mapping or mock auth)
CREATE TABLE login_identities (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  provider ENUM('firebase', 'mock') NOT NULL,
  provider_uid VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_provider_uid (provider, provider_uid)
);

-- Student profiles (extended info for students)
CREATE TABLE student_profiles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  grade_level INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user (user_id)
);

-- Subscriptions (for paywall)
CREATE TABLE subscriptions (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(36) NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  status ENUM('active', 'trial', 'expired', 'cancelled') NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMP NULL,
  subscription_ends_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE
);

-- Onboarding sessions (tracks onboarding flow)
CREATE TABLE onboarding_sessions (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(36) NOT NULL,
  supervisor_user_id CHAR(36) NOT NULL,
  student_user_id CHAR(36) NOT NULL,
  first_quiz_id CHAR(36),
  step ENUM('created', 'seeded', 'complete') NOT NULL DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Quizzes (for retention/review)
CREATE TABLE quizzes (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(36) NOT NULL,
  student_user_id CHAR(36) NOT NULL,
  title VARCHAR(255),
  status ENUM('draft', 'active', 'completed') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE
);
