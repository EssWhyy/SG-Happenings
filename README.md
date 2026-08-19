# SG Happenings
A Serverless bulletin Map of Singapore for anyone to share meetups, events, and second-hand trades for free!

## Stack

| Category | Technologies |
| :--- | :--- |
| **Main Code** | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) |
| **AWS Cloud** |  ![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-FF9900?style=for-the-badge&logo=awslambda&logoColor=white) ![Amazon DynamoDB](https://img.shields.io/badge/Amazon_DynamoDB-4053D6?style=for-the-badge&logo=amazondynamodb&logoColor=white) ![Amazon Cognito](https://img.shields.io/badge/Amazon_Cognito-DD344C?style=for-the-badge&logo=amazoncognito&logoColor=white)<br>![Amazon CloudFront](https://img.shields.io/badge/Amazon_CloudFront-8C4FFF?style=for-the-badge&logo=amazoncloudfront&logoColor=white) ![Amazon S3](https://img.shields.io/badge/Amazon_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white) ![OpenSearch](https://img.shields.io/badge/OpenSearch-005EB8?style=for-the-badge&logo=opensearch&logoColor=white) |
| **GCP Services** | ![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white) ![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=for-the-badge&logo=firebase&logoColor=white) |

## Screenshots

## Why I Made This

I struggled to find meaningful events fresh out of uni, when there were no longer any classes, CCAs or halls to make new friends or take respite from work. I tried out several meetup & events apps and I had a mixed experience with them. 

**Common pain points of such apps include: **
•	Events gatekept with high prices which most ordinary Singaporeans would not go to (Biz/Tech Symposiums for e.g.)
•	Searching for events is convoluted or ineffective, can't find events that I want to go, Eventbrite for example. Searching "skating" gives me events like "Falun Gong Exercise Workshop" and everything else besides skating events.
•	Having events be tied to or visible in specific groups that you need to join rather than all of them be visible from the start  (e.g. Meetup)

**So why make an platform of an events map of Singapore? **
•	Using a map to visualize events is effective because they show all events available, the proximity to you, and the nearby amenities around.  
•	All events listed will be free (monetary wise) to attend, this enables anyone to take charge and source for their own community. You can list all sorts of random hangouts and events, like this one: ()
•	Consumerism is just too rampant in Singapore, with so many people impulse buying stuff from ecommerce sites everytime there is a monthly sale, leading to increased consumer waste and transport emissions. Secondhand trade can not only save people money, but it promotes the value of a Circular Economy. (insert explanation or link to Circular Economy)


## Features

•	Interactive Geospatial Map
•	Effective Events Search
•	Second Hand Listings
•	Bookmarks/Sharing/Reminders 
•	Real-time chat (coming soon)


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


## Tradeoffs/What could be Improved
