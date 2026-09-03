


infisical login

infisical init

infisical run --env=dev -- node -e "console.log(process.env.SUPABASE_URL)"

infisical run --env=dev -- node -e "console.log(process.env.SUPABASE_SECRET_KEY)"


infisical run --env=dev -- npm run dev

# In VM


export INFISICAL_CLIENT_ID="..."
export INFISICAL_CLIENT_SECRET="..."


infisical login \
  --method=universal-auth \
  --client-id="$INFISICAL_CLIENT_ID" \
  --client-secret="$INFISICAL_CLIENT_SECRET" \
  --silent

export INFISICAL_PROJECT_ID="ASDC..."

infisical run \
  --token="$MY_TOKEN" \
  --projectId="$INFISICAL_PROJECT_ID" \
  --env=dev \
  -- npm start

  gcloud compute firewall-rules create allow-city-api-3000 `                               
>>   --allow=tcp:3000 `         
>>   --direction=INGRESS `                   
>>   --source-ranges=0.0.0.0/0 `
>>   --description="Allow City API port 3000" --project="...."

# In local


infisical run --env=dev -- npm run dev 