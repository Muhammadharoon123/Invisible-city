# Supabase "Sign in with Google" for everyone; Authority role only by Super Admin approval

Citizens must prove a real identity so Reports cannot be spammed anonymously, and the request was for JWT-based sessions. Instead of writing our own login and token code, every role signs in with Google through Supabase Auth, which proves Gmail ownership and issues the JWT session cookies. A Google sign-in alone only ever makes someone a Citizen: the Authority role is granted by a Super Admin after an Access request, and Office staff are added by an Authority, so nobody can make themselves an official.

## Considered Options

- **Our own email + password with JWTs and a verification email**: rejected for the deadline. More code to get wrong and an email-sending step before anyone can report. Email verification can still be added later through Supabase.
- **Phone verification by SMS code**: postponed. Costs money per message. The phone number is collected but not verified.
