# SG Happenings
A Serverless bulletin Map of Singapore for anyone to share meetups, events, and second-hand trades for free!

## Stack

| Category | Technologies |
| :--- | :--- |
| **Main Code** | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) |
| **AWS Cloud** |  ![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-FF9900?style=for-the-badge&logo=awslambda&logoColor=white) ![Amazon DynamoDB](https://img.shields.io/badge/Amazon_DynamoDB-4053D6?style=for-the-badge&logo=amazondynamodb&logoColor=white) ![Amazon Cognito](https://img.shields.io/badge/Amazon_Cognito-DD344C?style=for-the-badge&logo=amazoncognito&logoColor=white)<br>![Amazon CloudFront](https://img.shields.io/badge/Amazon_CloudFront-8C4FFF?style=for-the-badge&logo=amazoncloudfront&logoColor=white) ![Amazon S3](https://img.shields.io/badge/Amazon_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white) ![OpenSearch](https://img.shields.io/badge/OpenSearch-005EB8?style=for-the-badge&logo=opensearch&logoColor=white) |
| **GCP Services** | ![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white) ![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=for-the-badge&logo=firebase&logoColor=white) |

## Screenshots
<img width="1424" height="785" alt="Prototype Screenshot" src="https://github.com/user-attachments/assets/3e13e4d6-f00e-48e9-bd41-d42f9a0fbf9d" />

## Why I Made This

I struggled to find meaningful events fresh out of university when I no longer had classes, co-curricular activities, or hall life to meet people and take a break from work. I tried several meetup and event platforms, but my experience was mixed.

### Common Pain Points of Existing Platforms:

* High Price Barriers: Many listed events are expensive business or tech symposiums that the average person would not attend.
* Poor Search Relevance: Finding relevant events is often frustratingly difficult. For example, searching "skating" on Eventbrite returns results like "Falun Gong Exercise Workshop" instead of actual skating meetups.
* Walled Gardens: Apps like Meetup often bury events inside specific groups, forcing you to join a community first before seeing what is happening, rather than displaying everything openly from the start.

### Why Build an Interactive Event Map for Singapore?

* Location-First Visualization: A map immediately shows all available events around you, their proximity, and surrounding amenities.
* 100% Free Events: Every event listed is free to attend, empowering anyone to build or find a community without financial barriers. Anyone can host casual hangouts or niche activities—such as Insert Event Name.
* Promoting Sustainability & Community: Overconsumption is widespread, with monthly e-commerce sales driving up waste and transport emissions. Incorporating secondhand trades and community swaps not only saves people money, but also advances a Circular Economy by giving pre-loved items a second life.


## Features

*	Interactive Geospatial Map of Singapore, with different layovers
*	Effective Events Search
*	Second Hand Listings
*	Bookmarks, Sharing, Reminders for Events
*	Real-time private chat and chatrooms (Coming Soon)


## Setup (For Developers running on local)

Backend: 
```
cd backend
npx serverless dev
npx serverless deploy --stage dev (if changes to DynamoDB structure)
```
Frontend:
```
cd frontend
npm run dev
```

Run both backend and frontend together on VSCode, then access via localhost.

## Architecture Diagram
<img width="1662" height="992" alt="SGHappenings Archi Diagram drawio" src="https://github.com/user-attachments/assets/a8117818-5128-49f3-8708-0d61bd59d67e" />




## Contributing/Licence

MIT Licence. This project is still currently in development and not released to the public. Any feedback or contributions are welcome!
