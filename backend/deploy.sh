#!/bin/bash

# Care Compass Backend Deployment Script for Google Cloud Run
# Project: rice-hackathon25iah-606
# Region: us-central1

set -e  # Exit on any error

PROJECT_ID="rice-hackathon25iah-606"
REGION="us-central1"
SERVICE_NAME="care-compass-api"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Deploying Care Compass Backend to Cloud Run..."
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 > /dev/null; then
    echo "❌ Not authenticated with gcloud. Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo "📋 Setting project..."
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and push the container image
echo "🏗️  Building container image..."
gcloud builds submit --tag ${IMAGE_NAME} .

# Deploy to Cloud Run with environment variables
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --port 8000 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 300 \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GOOGLE_CLOUD_STORAGE_BUCKET=care-compass-photos,MONGODB_URI=mongodb+srv://ar155_db_user:fOFTDd0vnh0sMFwj@cluster0.axnlx9w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0,GOOGLE_MAPS_API_KEY=AIzaSyBgHWrGOlDhpIC0qpVMbnrm4Xc9wRYipZE,GEMINI_API_KEY=AIzaSyAInImQl1tsVYvSUlfnWh-HdnNyGoiBqvo"

echo "✅ Deployment complete!"
echo ""
echo "🌐 Service URL:"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")
echo "${SERVICE_URL}"
echo ""
echo "🧪 Test with HTTPie:"
echo "http GET ${SERVICE_URL}/health"
echo ""
echo "📝 Next steps:"
echo "1. Set remaining environment variables in Cloud Run console:"
echo "   - MONGODB_URI"
echo "   - GOOGLE_MAPS_API_KEY"
echo "   - GEMINI_API_KEY"
echo "2. Update frontend NEXT_PUBLIC_API_URL to: ${SERVICE_URL}"
echo "3. Test all endpoints with HTTPie"