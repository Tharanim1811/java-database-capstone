# Smart Clinic Management System Architecture

## Section 1: Architecture Summary

The Smart Clinic Management System is built using Spring Boot and follows a three-tier architecture consisting of the Presentation Layer, Application Layer, and Data Layer. The presentation layer includes both Thymeleaf-based dashboards for administrators and doctors, as well as REST API clients for modules such as appointments, patient dashboards, and patient records.

The application layer contains controllers, services, and business logic. Requests from users are handled by either MVC controllers or REST controllers and then passed to a common service layer. The service layer applies validations and business rules before interacting with repositories. The data layer uses two databases: MySQL for structured data such as patients, doctors, appointments, and administrators, and MongoDB for flexible prescription documents. Spring Data JPA is used for MySQL access, while Spring Data MongoDB is used for MongoDB operations.

## Section 2: Numbered Flow of Data and Control

1. Users access the application through Thymeleaf dashboards or REST API clients.
2. Requests are routed to the appropriate Thymeleaf Controller or REST Controller based on the URL and HTTP method.
3. Controllers delegate processing to the Service Layer.
4. The Service Layer applies business rules, validations, and workflow logic.
5. Services communicate with repositories to retrieve or store data in MySQL and MongoDB.
6. Repository results are mapped to application models such as JPA entities and MongoDB document objects.
7. The models are returned to the presentation layer, where they are rendered as HTML through Thymeleaf or serialized as JSON for REST API responses.