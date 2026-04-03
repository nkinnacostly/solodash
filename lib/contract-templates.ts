export interface ContractFields {
  freelancerName: string;
  businessName: string | null;
  clientName: string;
  projectDescription: string;
  paymentTerms: string;
  startDate: string;
  endDate?: string;
  hourlyRate?: number;
  estimatedHours?: number;
  projectFee?: number;
  retainerFee?: number;
  currency: string;
  scopeOfWork: string;
  revisions?: number;
  governingLaw: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  type: "hourly" | "project" | "retainer";
  fields: string[];
  content: (fields: ContractFields) => string;
}

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    GBP: "£",
    EUR: "€",
    NGN: "₦",
    GHS: "GH₵",
    KES: "KSh",
    ZAR: "R",
  };
  return symbols[currency] || currency + " ";
};

export const contractTemplates: ContractTemplate[] = [
  {
    id: "hourly",
    name: "Hourly Contract",
    description:
      "Bill by the hour with estimated timeframes. Ideal for ongoing work with flexible scope.",
    type: "hourly",
    fields: [
      "clientName",
      "projectDescription",
      "scopeOfWork",
      "hourlyRate",
      "estimatedHours",
      "currency",
      "paymentTerms",
      "startDate",
      "governingLaw",
    ],
    content: (fields: ContractFields) => {
      const symbol = getCurrencySymbol(fields.currency);
      const totalEstimate = (fields.hourlyRate || 0) * (fields.estimatedHours || 0);

      return `
        <div style="font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.6;">
          <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px; color: #0f0f0f;">Freelance Services Agreement</h1>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">Hourly Rate Contract</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">1. Parties</h2>
          <p>This Agreement is made between <strong>${fields.businessName || fields.freelancerName}</strong> ("Contractor") and <strong>${fields.clientName}</strong> ("Client"), effective as of <strong>${new Date(fields.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">2. Scope of Work</h2>
          <p>${fields.projectDescription}</p>
          <p style="margin-top: 12px;">The Contractor agrees to perform the following services:</p>
          <p style="white-space: pre-wrap; background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 8px;">${fields.scopeOfWork}</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">3. Compensation</h2>
          <p>The Client agrees to pay the Contractor at the following rate:</p>
          <ul style="margin: 12px 0; padding-left: 24px;">
            <li><strong>Hourly Rate:</strong> ${symbol}${fields.hourlyRate?.toLocaleString("en-US", { minimumFractionDigits: 2 })} per hour</li>
            <li><strong>Estimated Hours:</strong> ${fields.estimatedHours} hours</li>
            <li><strong>Estimated Total:</strong> ${symbol}${totalEstimate.toLocaleString("en-US", { minimumFractionDigits: 2 })}</li>
          </ul>
          <p style="margin-top: 12px; font-size: 14px; color: #6b7280;">Note: This is an estimate. Final billing will be based on actual hours worked. Contractor will notify Client if estimated hours are likely to be exceeded by more than 10%.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">4. Payment Terms</h2>
          <p>${fields.paymentTerms}</p>
          <p style="margin-top: 12px;">Invoices will be issued ${fields.paymentTerms.includes("weekly") ? "weekly" : fields.paymentTerms.includes("monthly") ? "monthly" : "upon completion"} and are payable within the agreed timeframe. Late payments may incur a 5% monthly interest charge.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">5. Time Tracking</h2>
          <p>The Contractor will maintain accurate records of time spent on the project and provide timesheets upon request. Time will be tracked in 15-minute increments.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">6. Intellectual Property</h2>
          <p>Upon full payment, all work product, including but not limited to code, designs, documents, and deliverables created under this Agreement, shall be the exclusive property of the Client. The Contractor retains the right to display the work in their professional portfolio unless otherwise agreed in writing.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">7. Confidentiality</h2>
          <p>Both parties agree to keep confidential all proprietary information exchanged during the course of this engagement. This includes, but is not limited to, business strategies, client data, trade secrets, and technical specifications. This obligation survives termination of this Agreement for a period of two (2) years.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">8. Independent Contractor</h2>
          <p>The Contractor is an independent contractor, not an employee. Nothing in this Agreement shall be construed to create a partnership, joint venture, or employer-employee relationship.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">9. Termination</h2>
          <p>Either party may terminate this Agreement with seven (7) days written notice. Upon termination, the Client shall pay for all hours worked up to the termination date. The Contractor shall deliver all completed work in progress.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">10. Governing Law</h2>
          <p>This Agreement shall be governed by and construed in accordance with the laws of <strong>${fields.governingLaw}</strong>. Any disputes arising under this Agreement shall be resolved through good faith negotiation before pursuing legal action.</p>

          <div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 32px;">By signing below, both parties acknowledge that they have read, understood, and agree to the terms of this Agreement.</p>
            
            <div style="display: flex; justify-content: space-between; margin-top: 48px;">
              <div style="flex: 1;">
                <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 8px;"></div>
                <p style="font-size: 14px;"><strong>${fields.businessName || fields.freelancerName}</strong></p>
                <p style="font-size: 12px; color: #6b7280;">Contractor</p>
                <p style="font-size: 12px; color: #6b7280;">Date: _________________</p>
              </div>
              <div style="flex: 1; margin-left: 48px;">
                <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 8px;"></div>
                <p style="font-size: 14px;"><strong>${fields.clientName}</strong></p>
                <p style="font-size: 12px; color: #6b7280;">Client</p>
                <p style="font-size: 12px; color: #6b7280;">Date: _________________</p>
              </div>
            </div>
          </div>
        </div>
      `;
    },
  },

  {
    id: "project",
    name: "Project Contract",
    description:
      "Fixed-fee agreement with clear deliverables and timelines. Best for defined projects.",
    type: "project",
    fields: [
      "clientName",
      "projectDescription",
      "scopeOfWork",
      "projectFee",
      "currency",
      "paymentTerms",
      "startDate",
      "endDate",
      "revisions",
      "governingLaw",
    ],
    content: (fields: ContractFields) => {
      const symbol = getCurrencySymbol(fields.currency);
      const endDateStr = fields.endDate
        ? new Date(fields.endDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "to be agreed";

      return `
        <div style="font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.6;">
          <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px; color: #0f0f0f;">Project-Based Services Agreement</h1>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">Fixed-Fee Contract</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">1. Parties</h2>
          <p>This Agreement is made between <strong>${fields.businessName || fields.freelancerName}</strong> ("Contractor") and <strong>${fields.clientName}</strong> ("Client"), effective as of <strong>${new Date(fields.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">2. Project Description</h2>
          <p>${fields.projectDescription}</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">3. Scope of Work & Deliverables</h2>
          <p>The Contractor agrees to deliver the following:</p>
          <p style="white-space: pre-wrap; background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 8px;">${fields.scopeOfWork}</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">4. Timeline</h2>
          <p><strong>Start Date:</strong> ${new Date(fields.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          <p><strong>Estimated Completion:</strong> ${endDateStr}</p>
          <p style="margin-top: 12px;">The Contractor will provide regular progress updates. Any delays will be communicated promptly with revised timelines.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">5. Compensation</h2>
          <p>The Client agrees to pay a fixed project fee of <strong>${symbol}${fields.projectFee?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong> for the complete scope of work outlined in this Agreement.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">6. Payment Schedule</h2>
          <p>${fields.paymentTerms}</p>
          <p style="margin-top: 12px;">Payments are due within the agreed timeframe. Work may be paused if payments are not received on time. Late payments may incur a 5% monthly interest charge.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">7. Revisions</h2>
          <p>This Agreement includes <strong>${fields.revisions || 2} rounds of revisions</strong>. Additional revisions beyond this limit will be billed at the Contractor's standard hourly rate. Revision requests must be specific and consolidated.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">8. Client Responsibilities</h2>
          <p>The Client agrees to:</p>
          <ul style="margin: 12px 0; padding-left: 24px;">
            <li>Provide all necessary materials, information, and access in a timely manner</li>
            <li>Respond to questions and feedback requests within three (3) business days</li>
            <li>Designate a single point of contact for project communications</li>
          </ul>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">9. Intellectual Property</h2>
          <p>Upon full payment, all deliverables and work product created under this Agreement shall be the exclusive property of the Client. The Contractor retains the right to display the work in their professional portfolio unless otherwise agreed in writing. Pre-existing intellectual property of either party remains the property of that party.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">10. Confidentiality</h2>
          <p>Both parties agree to maintain strict confidentiality regarding all proprietary information shared during this engagement, including business strategies, client data, technical specifications, and financial information. This obligation survives termination for a period of two (2) years.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">11. Independent Contractor</h2>
          <p>The Contractor is an independent contractor. This Agreement does not create a partnership, joint venture, franchise, or employer-employee relationship. The Contractor is solely responsible for their own taxes, insurance, and benefits.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">12. Scope Changes</h2>
          <p>Any changes to the scope of work must be agreed upon in writing. Significant scope changes may result in adjustments to the project fee and timeline. The Contractor will provide a written estimate for any additional work before proceeding.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">13. Termination</h2>
          <p>Either party may terminate this Agreement with fourteen (14) days written notice. Upon termination:</p>
          <ul style="margin: 12px 0; padding-left: 24px;">
            <li>The Client shall pay for all work completed to date</li>
            <li>The Contractor shall deliver all completed work and work in progress</li>
            <li>If terminated by Client without cause, a termination fee of 25% of the remaining project fee may apply</li>
          </ul>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">14. Limitation of Liability</h2>
          <p>The Contractor's total liability under this Agreement shall not exceed the total amount paid by the Client. The Contractor shall not be liable for any indirect, incidental, or consequential damages.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">15. Governing Law</h2>
          <p>This Agreement shall be governed by the laws of <strong>${fields.governingLaw}</strong>. Disputes shall first be addressed through good faith negotiation, then mediation if necessary, before pursuing legal action.</p>

          <div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 32px;">By signing below, both parties acknowledge that they have read, understood, and agree to be bound by the terms of this Agreement.</p>
            
            <div style="display: flex; justify-content: space-between; margin-top: 48px;">
              <div style="flex: 1;">
                <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 8px;"></div>
                <p style="font-size: 14px;"><strong>${fields.businessName || fields.freelancerName}</strong></p>
                <p style="font-size: 12px; color: #6b7280;">Contractor</p>
                <p style="font-size: 12px; color: #6b7280;">Date: _________________</p>
              </div>
              <div style="flex: 1; margin-left: 48px;">
                <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 8px;"></div>
                <p style="font-size: 14px;"><strong>${fields.clientName}</strong></p>
                <p style="font-size: 12px; color: #6b7280;">Client</p>
                <p style="font-size: 12px; color: #6b7280;">Date: _________________</p>
              </div>
            </div>
          </div>
        </div>
      `;
    },
  },

  {
    id: "retainer",
    name: "Retainer Agreement",
    description:
      "Monthly recurring engagement with defined scope. Perfect for ongoing support relationships.",
    type: "retainer",
    fields: [
      "clientName",
      "projectDescription",
      "scopeOfWork",
      "retainerFee",
      "currency",
      "paymentTerms",
      "startDate",
      "governingLaw",
    ],
    content: (fields: ContractFields) => {
      const symbol = getCurrencySymbol(fields.currency);

      return `
        <div style="font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.6;">
          <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px; color: #0f0f0f;">Monthly Retainer Agreement</h1>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">Ongoing Services Contract</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">1. Parties</h2>
          <p>This Retainer Agreement is made between <strong>${fields.businessName || fields.freelancerName}</strong> ("Contractor") and <strong>${fields.clientName}</strong> ("Client"), effective as of <strong>${new Date(fields.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">2. Scope of Services</h2>
          <p>${fields.projectDescription}</p>
          <p style="margin-top: 12px;">The Contractor will provide the following services on an ongoing monthly basis:</p>
          <p style="white-space: pre-wrap; background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 8px;">${fields.scopeOfWork}</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">3. Monthly Retainer Fee</h2>
          <p>The Client agrees to pay a monthly retainer fee of <strong>${symbol}${fields.retainerFee?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>.</p>
          <p style="margin-top: 12px;">This fee covers the services outlined in Section 2. Additional work outside the agreed scope will be billed separately at the Contractor's standard rates.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">4. Payment Terms</h2>
          <p>${fields.paymentTerms}</p>
          <p style="margin-top: 12px;">Invoices will be issued on the first day of each month and are payable within the agreed timeframe. Services may be suspended if payment is not received within seven (7) days of the due date. Late payments may incur a 5% monthly interest charge.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">5. Term and Renewal</h2>
          <p>This Agreement shall commence on <strong>${new Date(fields.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong> and continue on a month-to-month basis until terminated by either party.</p>
          <p style="margin-top: 12px;">Either party may terminate this Agreement by providing thirty (30) days written notice prior to the end of the current billing cycle.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">6. Availability and Response Time</h2>
          <p>The Contractor agrees to be available during standard business hours (9:00 AM - 6:00 PM, Monday through Friday). Urgent requests will be addressed within 24 hours. Regular requests will be addressed within two (2) business days.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">7. Unused Hours</h2>
          <p>Unused retainer hours do not roll over to the following month. The retainer fee is a fixed monthly commitment regardless of actual usage, ensuring the Contractor's availability for the Client's needs.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">8. Intellectual Property</h2>
          <p>All work product created under this Agreement shall be the exclusive property of the Client upon payment of the retainer fee. The Contractor retains the right to display the work in their professional portfolio unless otherwise agreed in writing.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">9. Confidentiality</h2>
          <p>Both parties agree to maintain strict confidentiality regarding all proprietary information exchanged during this engagement. This includes business strategies, client data, trade secrets, technical information, and financial data. This obligation survives termination for a period of two (2) years.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">10. Independent Contractor</h2>
          <p>The Contractor is an independent contractor, not an employee. This Agreement does not create a partnership, joint venture, or employer-employee relationship. The Contractor is responsible for their own taxes, insurance, benefits, and work methods.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">11. Reporting and Communication</h2>
          <p>The Contractor will provide monthly reports detailing work completed, time invested, and recommendations. Regular check-in meetings will be scheduled as mutually agreed. Communication will primarily occur via email and scheduled video calls.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">12. Fee Adjustments</h2>
          <p>The retainer fee may be adjusted with sixty (60) days written notice. Fee adjustments will reflect changes in scope, market rates, or the value of services provided. The Client may terminate the Agreement rather than accept a fee increase.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">13. Termination</h2>
          <p>Either party may terminate this Agreement with thirty (30) days written notice. Upon termination:</p>
          <ul style="margin: 12px 0; padding-left: 24px;">
            <li>The Client shall pay for the current month's retainer fee</li>
            <li>The Contractor shall deliver all completed work and relevant materials</li>
            <li>The Contractor will provide reasonable transition assistance during the notice period</li>
          </ul>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">14. Limitation of Liability</h2>
          <p>The Contractor's total liability under this Agreement shall not exceed the retainer fee paid for the three (3) months preceding the claim. The Contractor shall not be liable for indirect, incidental, special, or consequential damages.</p>

          <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">15. Governing Law</h2>
          <p>This Agreement shall be governed by the laws of <strong>${fields.governingLaw}</strong>. Any disputes shall first be addressed through good faith negotiation, then mediation, before pursuing legal action.</p>

          <div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 32px;">By signing below, both parties acknowledge that they have read, understood, and agree to be bound by the terms of this Retainer Agreement.</p>
            
            <div style="display: flex; justify-content: space-between; margin-top: 48px;">
              <div style="flex: 1;">
                <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 8px;"></div>
                <p style="font-size: 14px;"><strong>${fields.businessName || fields.freelancerName}</strong></p>
                <p style="font-size: 12px; color: #6b7280;">Contractor</p>
                <p style="font-size: 12px; color: #6b7280;">Date: _________________</p>
              </div>
              <div style="flex: 1; margin-left: 48px;">
                <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 8px;"></div>
                <p style="font-size: 14px;"><strong>${fields.clientName}</strong></p>
                <p style="font-size: 12px; color: #6b7280;">Client</p>
                <p style="font-size: 12px; color: #6b7280;">Date: _________________</p>
              </div>
            </div>
          </div>
        </div>
      `;
    },
  },
];

export function getTemplateById(id: string): ContractTemplate | undefined {
  return contractTemplates.find((t) => t.id === id);
}
