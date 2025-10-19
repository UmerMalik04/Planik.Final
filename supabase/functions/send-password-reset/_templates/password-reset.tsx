import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PasswordResetEmailProps {
  resetLink: string
}

export const PasswordResetEmail = ({
  resetLink,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your Planik password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset Your Password</Heading>
        <Text style={subtitle}>Planik Fitness App</Text>
        
        <Section style={messageBox}>
          <Text style={text}>Hello,</Text>
          <Text style={text}>
            You requested to reset your password for your Planik account.
          </Text>
          <Text style={text}>
            Click the button below to reset your password:
          </Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={resetLink}>
            Reset My Password
          </Button>
        </Section>

        <Section style={securityTip}>
          <Text style={securityText}>
            <strong>Security tip:</strong> This link will expire in 24 hours for your security.
          </Text>
        </Section>

        <Text style={footerText}>
          If you can't click the button, copy and paste this link into your browser:
        </Text>
        <Text style={linkText}>{resetLink}</Text>

        <Text style={footer}>
          If you didn't request this password reset, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#1a1a1a',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0 10px',
}

const subtitle = {
  color: '#999999',
  fontSize: '16px',
  textAlign: 'center' as const,
  margin: '0 0 30px',
}

const messageBox = {
  backgroundColor: '#2a2a2a',
  borderRadius: '8px',
  padding: '30px',
  margin: '20px 0',
}

const text = {
  color: '#cccccc',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#4A9EFF',
  borderRadius: '8px',
  color: '#000000',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
}

const securityTip = {
  backgroundColor: '#4a4a2a',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
}

const securityText = {
  color: '#d4c894',
  fontSize: '14px',
  margin: '0',
}

const footerText = {
  color: '#999999',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '20px 0 10px',
}

const linkText = {
  color: '#4A9EFF',
  fontSize: '12px',
  wordBreak: 'break-all' as const,
  margin: '0 0 20px',
}

const footer = {
  color: '#666666',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '30px 0 0',
}
