import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
      signUpVerificationMethod: "code",
    },
  },
});

export const API_URL = process.env.REACT_APP_API_URL;
