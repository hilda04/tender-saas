# ZimTender — Deployment Guide
# Follow these steps ONCE. After that, everything runs itself.

## BEFORE YOU START — collect these:
# [ ] AWS account (free at aws.amazon.com)
# [ ] OpenAI API key — platform.openai.com → API keys
# [ ] Stripe account — stripe.com (use Test mode first, go live later)
# [ ] A domain name (optional but recommended — e.g. zimtender.co.zw from Domains.co.zw)
# [ ] GitHub account (free)

## ─────────────────────────────────────────────────────────────
## STEP 1 — Install tools on your computer (once ever)
## ─────────────────────────────────────────────────────────────

# Install Node.js (nodejs.org → LTS version)
# Then run:
npm install -g aws-sam-cli
npm install -g @aws-amplify/cli

# Install AWS CLI (docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
# Then configure it with your AWS credentials:
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1 recommended), Output (json)


## ─────────────────────────────────────────────────────────────
## STEP 2 — Set up Stripe (10 minutes)
## ─────────────────────────────────────────────────────────────

# 1. Go to stripe.com → Dashboard → Products → Add product
#    Name: "ZimTender Pro"
#    Price: $39.00 USD, Recurring, Monthly
#    Copy the Price ID (looks like: price_1Abc123...)

# 2. Go to Developers → API Keys
#    Copy your Secret Key (sk_test_... for test, sk_live_... for production)

# 3. Go to Developers → Webhooks → Add endpoint
#    URL: https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/v1/webhooks/stripe
#    (You'll get this API URL after Step 3 — come back to fill this in)
#    Events to listen for:
#      - checkout.session.completed
#      - customer.subscription.updated
#      - customer.subscription.deleted
#      - invoice.payment_failed
#    Copy the Webhook Signing Secret (whsec_...)


## ─────────────────────────────────────────────────────────────
## STEP 3 — Deploy the backend (SAM)
## ─────────────────────────────────────────────────────────────

cd zimtender-backend   # or wherever you put this folder

# Install backend dependencies
cd backend/src && npm install && cd ../..

# Build the SAM package
sam build

# Deploy — this walks you through setup the FIRST time
sam deploy --guided

# Answer the prompts like this:
#   Stack Name: zimtender-production
#   AWS Region: us-east-1
#   OpenAIApiKey: sk-proj-YOUR_KEY_HERE
#   StripeSecretKey: sk_test_YOUR_KEY_HERE
#   StripeWebhookSecret: whsec_YOUR_SECRET_HERE
#   StripePriceId: price_YOUR_PRICE_ID
#   FrontendUrl: https://main.XXXXXX.amplifyapp.com  ← placeholder for now, update in Step 5
#   Environment: production
#   Confirm changes before deploy: Y
#   Allow SAM CLI IAM role creation: Y
#   Save arguments to samconfig.toml: Y

# After deploy completes, note the OUTPUTS:
#   ApiUrl        → copy this, you need it in Step 4 and for Stripe webhook
#   UserPoolId    → copy this
#   UserPoolClientId → copy this

# Go back to Stripe → Webhooks → paste the ApiUrl + /webhooks/stripe


## ─────────────────────────────────────────────────────────────
## STEP 4 — Set up Amplify frontend
## ─────────────────────────────────────────────────────────────

# Push this project to GitHub first:
git init
git add .
git commit -m "Initial ZimTender deployment"
git remote add origin https://github.com/YOUR_USERNAME/zimtender.git
git push -u origin main

# In AWS Console → Amplify → New App → Host web app
# → Connect GitHub → Select your repo → Select branch: main
# → App name: zimtender
# → Build settings: Amplify auto-detects amplify.yml ✓
# → Environment variables (ADD ALL OF THESE):
#
#   REACT_APP_USER_POOL_ID         = us-east-1_XXXXXXX   (from SAM outputs)
#   REACT_APP_USER_POOL_CLIENT_ID  = XXXXXXXXXXXXX       (from SAM outputs)
#   REACT_APP_API_URL              = https://XXXXX.execute-api.us-east-1.amazonaws.com/v1
#
# → Save and deploy

# After Amplify deploys, copy your Amplify URL:
#   https://main.XXXXXXXXXXXXXXX.amplifyapp.com


## ─────────────────────────────────────────────────────────────
## STEP 5 — Update FrontendUrl in SAM (for CORS)
## ─────────────────────────────────────────────────────────────

# Now that you have the real Amplify URL, update the SAM parameter:
# Edit samconfig.toml — change FrontendUrl to your real Amplify URL
# Then redeploy:
sam deploy

# This makes the API accept requests from your frontend domain.


## ─────────────────────────────────────────────────────────────
## STEP 6 — (Optional) Custom domain
## ─────────────────────────────────────────────────────────────

# In Amplify → Domain management → Add domain
# Enter your domain (e.g. zimtender.co.zw)
# Follow Amplify's DNS instructions for your registrar
# Amplify provisions SSL automatically — takes ~30 minutes

# Update FrontendUrl in samconfig.toml to your custom domain
# and run: sam deploy


## ─────────────────────────────────────────────────────────────
## STEP 7 — Test end to end
## ─────────────────────────────────────────────────────────────

# 1. Open your Amplify URL
# 2. Sign up with your email
# 3. Verify your email (check inbox)
# 4. Fill in company profile
# 5. Create a new tender (use a real Zim tender for best results)
# 6. Click "Generate response" — should take 30-60 seconds
# 7. Click "Download .docx" — open and verify the document

# For payment testing, use Stripe test card:
#   Card: 4242 4242 4242 4242
#   Expiry: any future date
#   CVC: any 3 digits


## ─────────────────────────────────────────────────────────────
## STEP 8 — Go live with real payments
## ─────────────────────────────────────────────────────────────

# 1. Activate your Stripe account (add bank details)
# 2. In Stripe → toggle from Test to Live mode
# 3. Create a new Live product with $39/month price
# 4. Get your Live API keys and Webhook secret
# 5. Update samconfig.toml with live keys + live price ID
# 6. sam deploy
# Done — real payments are now live.


## ─────────────────────────────────────────────────────────────
## ONGOING DEPLOYMENT — future updates
## ─────────────────────────────────────────────────────────────

# Frontend (automatic):
# Just push to GitHub main branch → Amplify auto-rebuilds and deploys

# Backend changes:
sam build && sam deploy
# Takes about 2 minutes, zero downtime


## ─────────────────────────────────────────────────────────────
## MONTHLY AWS COSTS (estimate)
## ─────────────────────────────────────────────────────────────

# 0 users:     ~$1/month (S3 storage, minimal)
# 50 users:    ~$3-5/month
# 200 users:   ~$8-12/month
# All other costs (Cognito free tier, Lambda pay-per-use, DynamoDB pay-per-request)
# scale only when you have revenue.

# OpenAI API cost per generation: depends on selected model and token usage (for example, GPT-4o mini is typically low-cost for this workload).
# So 100 generations/month = ~$5-10 in API costs
# At $39/user, break-even is easily covered.


## ─────────────────────────────────────────────────────────────
## IF SOMETHING BREAKS — how to debug
## ─────────────────────────────────────────────────────────────

# View Lambda logs (replace function name):
aws logs tail /aws/lambda/zimtender-generate-production --follow

# View all Lambda logs:
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/zimtender

# Check DynamoDB:
aws dynamodb scan --table-name zimtender-users-production

# Re-deploy after code change:
sam build && sam deploy
