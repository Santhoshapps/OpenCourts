import React from 'react';
import LegalPageLayout from '../components/legal/LegalPageLayout';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Privacy Policy">
        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <h3>1. Introduction</h3>
        <p>
            Welcome to OpenCourts ("we," "our," "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (the "Service"). Please read this policy carefully. If you do not agree with the terms of this privacy policy, please do not access the Service.
        </p>
        <p>
            By using our Service, you consent to the data practices described in this statement.
        </p>

        <h3>2. Information We Collect</h3>
        <p>We may collect information about you in a variety of ways. The information we may collect via the Service includes:</p>
        
        <h4>A. Personal Data You Provide to Us</h4>
        <ul>
            <li><strong>Account Information:</strong> When you register, we collect personal information, such as your full name and email address.</li>
            <li><strong>Profile Information:</strong> You may choose to provide additional information for your player profile, such as a display name, skill ratings (NTRP, UTR), play style preferences, a biography, and your home location (address, city, state).</li>
            <li><strong>User Content:</strong> We collect information you provide when you add courts, report issues, send messages to other users, or provide feedback on players.</li>
            <li><strong>Payment Information:</strong> If you make payments (e.g., for tournament entry), we use a third-party payment processor (Stripe). We do not store or collect your payment card details. That information is provided directly to our third-party payment processors whose use of your personal information is governed by their Privacy Policy.</li>
        </ul>

        <h4>B. Data Collected Automatically</h4>
        <ul>
            <li>
                <strong>Location Data:</strong> Our Service's core functionality is location-based. With your permission, we collect your precise geolocation data to find nearby courts, connect you with nearby players, and enable automatic check-ins. You can change your location permissions at any time in your device's settings, but this will limit your ability to use key features of the Service. We may also use your IP address to infer your approximate location.
            </li>
            <li>
                <strong>Usage Data:</strong> We automatically collect information about your interaction with the Service, such as the pages or features you use, the time and date of your visits, your IP address, browser type, and device identifiers.
            </li>
            <li>
                <strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to track the activity on our Service and hold certain information.
            </li>
        </ul>

        <h3>3. How We Use Your Information</h3>
        <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:</p>
        <ul>
            <li>Create and manage your account.</li>
            <li>Provide, operate, and maintain the core functionalities of the Service, such as finding courts and players.</li>
            <li>Process your transactions and payments.</li>
            <li>Facilitate communication between users.</li>
            <li>Monitor and analyze usage and trends to improve your experience with the Service.</li>
            <li>Notify you about updates to our Service.</li>
            <li>For security purposes, to prevent fraud and enforce our policies.</li>
            <li>Respond to legal requests and prevent harm.</li>
        </ul>

        <h3>4. How We Share Your Information</h3>
        <p>We do not sell your personal information. We may share information we have collected about you in certain situations:</p>
        <ul>
            <li>
                <strong>With Other Users:</strong> Your public profile (display name, skill ratings, bio) is visible to other users. Your precise location is never shared. We only show your proximity to other users (e.g., "5 miles away"). When you check into a court, other users may see that you are playing at that location.
            </li>
            <li>
                <strong>With Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including cloud hosting (e.g., Supabase/AWS), payment processing (Stripe), data analysis, and email delivery. These service providers will have access to your information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
            </li>
            <li>
                <strong>For Legal Reasons:</strong> We may disclose your information if we are required to do so by law or in the good faith belief that such action is necessary to comply with a legal obligation, protect and defend our rights or property, prevent or investigate possible wrongdoing in connection with the Service, or protect the personal safety of users or the public.
            </li>
            <li>
                <strong>Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition of all or a portion of our business by another company, your information may be transferred.
            </li>
        </ul>

        <h3>5. Your Rights and Choices</h3>
        <ul>
            <li><strong>Account Information:</strong> You may at any time review or change the information in your account or terminate your account by accessing your profile settings.</li>
            <li><strong>Location Data:</strong> You can disable location services at any time through your device settings.</li>
            <li><strong>Communications:</strong> You can opt out of receiving promotional emails from us by following the unsubscribe link in those emails.</li>
            <li><strong>Account Deletion:</strong> You can delete your account at any time from the profile settings page. Please note that we may retain some information as required by law or for legitimate business purposes.</li>
        </ul>

        <h3>6. Data Security</h3>
        <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>

        <h3>7. Children's Privacy</h3>
        <p>Our Service is not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.</p>
        
        <h3>8. Changes to This Privacy Policy</h3>
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.</p>

        <h3>9. Contact Us</h3>
        <p>If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:[your-support-email@example.com]">[your-support-email@example.com]</a></p>
    </LegalPageLayout>
  );
}