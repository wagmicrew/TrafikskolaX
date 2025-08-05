# Database Documentation

This document provides an overview of the database schema for the Din Trafikskola system. It includes tables, columns, and usage in the code to assist developers in understanding the data structure.

## Tables Overview

### Users Table
- **Table Name**: users
- **Primary Key**: id

| Column          | Type      | Description                                           |
|-----------------|-----------|-------------------------------------------------------|
| id              | UUID      | Unique identifier for each user                       |
| email           | VARCHAR   | User's email address                                  |
| firstName       | VARCHAR   | User's first name                                     |
| lastName        | VARCHAR   | User's last name                                      |
| role            | ENUM      | User's role (student, teacher, admin)                 |
| isActive        | BOOLEAN   | Indicates if the user is active                       |
| createdAt       | TIMESTAMP | Timestamp when the user was created                   |
| updatedAt       | TIMESTAMP | Timestamp when the user was last updated              |

**Usage in Code**:
- Used for authentication and authorization.
- Determining access to different parts of the system.

### Bookings Table
- **Table Name**: bookings
- **Primary Key**: id

| Column          | Type      | Description                                           |
|-----------------|-----------|-------------------------------------------------------|
| id              | UUID      | Unique booking identifier                             |
| userId          | UUID      | References the user who made the booking              |
| scheduledDate   | DATE      | Date of the booking                                   |
| startTime       | TIME      | Start time of the booking                             |
| endTime         | TIME      | End time of the booking                               |
| lessonTypeId    | UUID      | Type of lesson booked                                 |
| status          | VARCHAR   | Status of the booking (confirmed, cancelled, etc.)    |
| createdAt       | TIMESTAMP | Timestamp when the booking was created                |
| updatedAt       | TIMESTAMP | Timestamp when the booking was last updated           |

**Usage in Code**:
- Managing user bookings.
- Sending reminders and confirmations.

### Site Settings Table
- **Table Name**: siteSettings
- **Primary Key**: key

| Column          | Type      | Description                                           |
|-----------------|-----------|-------------------------------------------------------|
| key             | VARCHAR   | Unique key for each setting                           |
| value           | TEXT      | Value associated with the setting                     |
| description     | TEXT      | Description of what the setting controls              |
| category        | VARCHAR   | Category of the setting (email, general, etc.)        |
| isEnv           | BOOLEAN   | Indicates if the setting is environment-related       |
| createdAt       | TIMESTAMP | Timestamp when the setting was created                |
| updatedAt       | TIMESTAMP | Timestamp when the setting was last updated           |

**Usage in Code**:
- Configuring system behavior.
- Storing email-related configurations and other settings.

## References in Code

The schema for these tables is defined in the codebase under `lib/db/schema.ts`. The code interacts with these tables primarily in the `lib/db` and `lib/email` modules, utilizing the Drizzle ORM for query handling and configuration retrieval.

This document should serve as a foundational guide to understanding and extending the database as needed for future development.
