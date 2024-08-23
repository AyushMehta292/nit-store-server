import {
  Html,
  Head,
  Font,
  Preview,
  Heading,
  Row,
  Section,
  Text,
  Button
} from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  userName: string;
  otp: string;
}

export default function RegistrationEmail({ userName, otp }: VerificationEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Verification Code</title>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>Here's your verification code: {otp}</Preview>
      <Section>
        <Row>
          <Heading as="h2">Hello {userName},</Heading>
        </Row>
        <Row>
          <Text>
            Thank you for registering. Please use the following verification
            code to complete your registration:
          </Text>
        </Row>
        <Row>
          <Text style={{ fontSize: '20px', fontWeight: 'bold' }}>{otp}</Text> 
        </Row>
        <Row>
          <Text>
            Please do not share the OTP with anyone. If you did not request this code, please ignore this email.
          </Text>
        </Row>
        {/* Uncomment and update the URL if needed */}
        {/* <Row>
          <Button
            href={`http://localhost:3000/verify/${userName}`}
            style={{ color: '#61dafb' }}
          >
            Verify here
          </Button>
        </Row> */}
      </Section>
    </Html>
  );
}
