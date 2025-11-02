import React from 'react';
import LegalPageLayout from '../components/legal/LegalPageLayout';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TermsOfService() {
  return (
    <LegalPageLayout title="Terms of Service">
        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the OpenCourts mobile application and website (the "Service") operated by [Your Company Name] ("us", "we", or "our").</p>
        
        <p>Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.</p>
        
        <p><strong>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</strong></p>

        <h3>1. The Service</h3>
        <p>OpenCourts provides a platform for tennis and pickleball players to find courts, connect with other players, schedule matches, and participate in local tournaments. The Service includes location-based features as a core component of its functionality.</p>

        <h3>2. User Accounts</h3>
        <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>

        <h3>3. User Content and Conduct</h3>
        <p>You are solely responsible for the content you post, including your profile information, messages, and feedback ("User Content"). You grant us a non-exclusive, worldwide, royalty-free, transferable license to use, store, display, reproduce, and distribute your User Content on and through the Service for the purposes of operating, developing, and providing the Service.</p>
        <p>You agree not to post User Content that: (i) is unlawful, libelous, defamatory, obscene, pornographic, indecent, lewd, suggestive, harassing, threatening, invasive of privacy or publicity rights, abusive, inflammatory, or fraudulent; (ii) would constitute, encourage or provide instructions for a criminal offense, violate the rights of any party, or that would otherwise create liability or violate any local, state, national or international law.</p>

        <h3>4. Payments and Fees</h3>
        <p>Certain features of the Service, such as tournament entry, may require payment. We use a third-party payment processor (Stripe) to handle all payments. By providing payment information, you agree to their terms and conditions. All fees are non-refundable unless otherwise stated.</p>

        <h3>5. Location-Based Services</h3>
        <p>A core feature of our service is to provide location-based information. By using the Service, you consent to us using your device's location data to provide these features. We do not guarantee the accuracy or completeness of any location data or other information provided through the Service.</p>

        <h3>6. Disclaimers of Warranties</h3>
        <p>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, WE EXPRESSLY DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTY THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.</p>

        <h3>7. Limitation of Liability</h3>
        <p>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL [Your Company Name], ITS AFFILIATES, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (I) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (II) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; (III) ANY CONTENT OBTAINED FROM THE SERVICE; OR (IV) UNAUTHORIZED ACCESS, USE OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.</p>
        <p>IN NO EVENT SHALL OUR AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE EXCEED THE GREATER OF ONE HUNDRED U.S. DOLLARS (U.S. $100.00) OR THE AMOUNT YOU PAID US, IF ANY, IN THE LAST SIX MONTHS.</p>

        <h3>8. Indemnification</h3>
        <p>You agree to defend, indemnify and hold harmless [Your Company Name] and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees), resulting from or arising out of a) your use and access of the Service, by you or any person using your account and password, or b) a breach of these Terms.</p>

        <h3>9. Dispute Resolution, Governing Law, and Arbitration</h3>
        <p><strong>Governing Law:</strong> These Terms shall be governed and construed in accordance with the laws of the State of [Your State], United States, without regard to its conflict of law provisions.</p>
        <p><strong>Arbitration:</strong> You agree that any dispute, claim, or controversy arising out of or relating to these Terms or the breach, termination, enforcement, interpretation, or validity thereof or the use of the Service will be settled by binding arbitration, except that each party retains the right to bring an individual action in small claims court and the right to seek injunctive or other equitable relief in a court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation or violation of a party's copyrights, trademarks, trade secrets, patents or other intellectual property rights.</p>
        <p><strong>Class Action Waiver:</strong> YOU AND WE AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.</p>

        <h3>10. Termination</h3>
        <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>

        <h3>11. Changes to Terms</h3>
        <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

        <h3>12. Contact Us</h3>
        <p>If you have any questions about these Terms, please contact us at: <a href="mailto:[your-support-email@example.com]">[your-support-email@example.com]</a></p>
    </LegalPageLayout>
  );
}