import React from "react";
import {
  Html,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
  Button,
} from "@react-email/components";

interface ContractEmailProps {
  clientName: string;
  freelancerName: string;
  businessName: string | null;
  contractTitle: string;
  signingLink: string;
  contractType: string;
}

const header = {
  backgroundColor: "#0f0f0f",
  padding: "32px 24px",
  textAlign: "center" as const,
};

const logo = {
  color: "#10b981",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
};

const content = {
  padding: "32px 24px",
  backgroundColor: "#ffffff",
};

const greeting = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#0f0f0f",
  marginBottom: "16px",
};

const bodyText = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4b5563",
  marginBottom: "16px",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  marginTop: "24px",
  marginBottom: "24px",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer = {
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center" as const,
  marginTop: "16px",
};

const footerLink = {
  color: "#9ca3af",
  textDecoration: "underline",
};

export function ContractEmail({
  clientName,
  freelancerName,
  businessName,
  contractTitle,
  signingLink,
  contractType,
}: ContractEmailProps) {
  return (
    <Html>
      <Body style={{ margin: 0, padding: 0, backgroundColor: "#f3f4f6" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto" }}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>Paidly</Text>
          </Section>

          {/* Body */}
          <Section style={content}>
            <Text style={greeting}>Hi {clientName},</Text>

            <Text style={bodyText}>
              <strong>{businessName || freelancerName}</strong> has sent you a{" "}
              <strong>{contractType}</strong> for your review and signature:
            </Text>

            <Text
              style={{
                ...bodyText,
                backgroundColor: "#f9fafb",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontWeight: "600",
                color: "#0f0f0f",
              }}
            >
              {contractTitle}
            </Text>

            <Text style={bodyText}>
              Please review the contract carefully. If everything looks good,
              click the button below to sign it electronically.
            </Text>

            <Button href={signingLink} style={button}>
              Review & Sign Contract →
            </Button>

            <Text
              style={{
                ...bodyText,
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              If the button doesn't work, copy and paste this link into your
              browser:
              <br />
              <Link href={signingLink} style={{ color: "#10b981" }}>
                {signingLink}
              </Link>
            </Text>

            <Hr style={divider} />

            <Text style={footer}>
              This contract was sent via Paidly ·{" "}
              <Link href="https://getpaidly.co" style={footerLink}>
                getpaidly.co
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
