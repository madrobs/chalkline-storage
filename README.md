# chalkline-storage

Internal object-storage API for Chalkline Athletics services.

## Workshop

Attendees are not expected to run this service, and they are not given credentials for the workshop bucket. The facilitator runs it.

If you want to try the service yourself, use a bucket in an account you control. Do not point it at someone else's bucket.

## Setup

Git and Node 22 or newer. See the receipts-api README if you still need Homebrew.

```bash
git clone https://github.com/madrobs/chalkline-storage.git
cd chalkline-storage
npm install
```

`npm install` is required. This service depends on the AWS SDK.

## Run against local files

```bash
npm start
```

```bash
curl -s -X POST localhost:4000/objects \
  -H 'content-type: application/json' \
  -d '{"key":"drop-ins/test.json","body":"{}","contentType":"application/json"}'
```

With `OBJECTS_BUCKET` unset, objects are written under `data/`.

## Run against your own bucket

Create or choose an S3 bucket in your account, then start the server with that bucket name. The process uses the standard AWS credential chain (environment variables or an AWS profile). This repo does not contain keys.

```bash
export AWS_REGION=us-east-1
export AWS_PROFILE=your-profile
export OBJECTS_BUCKET=your-bucket-name
npm start
```

The identity in `AWS_PROFILE` needs permission to write objects to that bucket. `GET /health` returns `{ "ok": true }`.
