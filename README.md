# Repair E-commerce Backend Server Documentation

Welcome to the documentation for the Repair E-commerce Backend Server, the backbone of the Repair Android app, and the Admin panel. This NodeJS-based backend server empowers your e-commerce application with various essential features, including user authentication, notifications, payment processing, and seamless database management. This README provides an overview of the project, setup instructions, and essential information for contributors.

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [Environment Variables](#environment-variables)
5. [Authentication](#authentication)
6. [Notifications](#notifications)
7. [Payment System](#payment-system)
8. [Database](#database)
9. [Testing](#testing)
10. [Contributing](#contributing)
11. [License](#license)

## Introduction

The Repair E-commerce Backend Server serves as the foundation for the Repair Android app and the Admin panel, driving their functionality. This server is developed in Node.js, leveraging Express for route handling and MongoDB Atlas for cloud-based database storage.

## Features

1. **Login with Password**: Users can securely log in using their username and password.
2. **Google Login**: Provides a seamless Google-based authentication method for user convenience.
3. **Sending Notifications**: Utilizes the Expo server to send real-time notifications to the Repair Android app.
4. **Password Encryption**: Safely encrypts passwords to protect user data.
5. **Admin and Role-Based Authentication**: Supports multiple user roles, including Admin, with role-based access control.
6. **Payment System with SSLCOMMERZ**: Integrates the SSLCOMMERZ payment gateway for secure payment processing.
7. **Remote MongoDB Cloud Database**: Connects to a remote MongoDB Atlas database for cloud-based data storage.

## Getting Started

To run the Repair E-commerce Backend Server locally, follow these steps:

1. Clone this repository to your local machine.
2. Install project dependencies using `npm install`.
3. Create a `.env` file in the project root and populate it with the environment variables mentioned in the [Environment Variables](#environment-variables) section.
4. Start the server with `npm start`.

## Environment Variables

In the `.env` file, add the following environment variables with appropriate values:

```env
PORT=[Define a PORT]
URL=http://Your_IP:PORT
REPAIR_DB_PASSWORD=[Your MongoDB database password]

EMAIL_USER=[Mailtrap user]
EMAIL_PASS=[Mailtrap password]
EMAIL_HOST=[Mailtrap host]
EMAIL_PORT=[Mailtrap port]

REACT_NATIVE_APP_GOOGLE_STANDALONE_CLIENT_ID=
REACT_NATIVE_APP_GOOGLE_CLIENT_ID=
REACT_APP_GOOGLE_CLIENT_ID=
# Obtain these Google Client IDs from the Google Developer Console.

SSLCOMMERZ_STORE_ID=[SSLCOMMERZ Developer ID]
SSLCOMMERZ_STORE_PASSWD=[SSLCOMMERZ Developer Password]

REPAIR_JWT_PRIVATE_KEY=[Any random 10-digit number]
REPAIR_JWT_REFRESH_TOKEN_PRIVATE_KEY=[Any random 15-digit number]

JWT_EXPIRATION_TIME=12h
JWT_REFRESH_TOKEN_EXPIRATION_TIME=90d
EMAIL_TOKEN_EXPIRATION_TIME=20m
...
```

Replace placeholders with your actual values.

## Authentication

Detailed documentation on implementing and managing authentication can be found in the project's authentication documentation.

## Notifications
Real-time notifications are delivered using the Expo server. For integration and management of notifications, refer to the project's notifications documentation.

### Payment System
Integration with the SSLCOMMERZ payment gateway ensures secure and smooth payment processing. Find instructions for configuring and managing the payment system in the project's payment system documentation.

### Database
This server connects to a remote MongoDB Atlas database for data storage. Set up and manage the database with guidelines provided in the project's database documentation.

### Testing
Both manual and automated tests are conducted using the Jest library. For more information on running and writing tests, refer to the project's testing documentation.

### Contributing
Contributions to enhance and extend the functionality of the Repair E-commerce Backend Server are welcome. Review the project's contribution guidelines in the repository for instructions on contributing.

### License
This project is licensed under the MIT License. See the LICENSE.md file for detailed licensing information.

<hr>

Thank you for using the Repair E-commerce Backend Server. If you have questions, encounter issues, or wish to contribute, please reach out to the project maintainers.

Happy coding!






