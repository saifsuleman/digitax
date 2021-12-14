# Enrichment Tracker

## Author

`Saif Suleman <saif@visionituk.com`

## API

### REST API

Makes use of GET HTTP requests with url encodes

- `/authenticate?username=saif&password=saif`
- `/register?username=saif&password=saif`
- `/checktoken?token=7439287892374897`

### Prerequisites

- MongoDB on localhost:27107
- Mongo Database named `authentications`
- Mongo Collectiosn in `authentications` named `logins`
