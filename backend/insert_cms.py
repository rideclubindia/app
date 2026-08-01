import os
import psycopg2
from datetime import datetime

DB_URL = "postgresql://postgres:[YOUR-PASSWORD]@db.gqgxrdoprlkketyvxnac.supabase.co:5432/postgres?sslmode=require"

fallbackPrivacyText = """RIDE CLUB PRIVACY POLICY

Welcome to Ride Club. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our application and tell you about your privacy rights and how the law protects you. Ride Club operates as a real-time community-driven navigation and alert application designed to improve safety, coordinate group rides, and provide crowdsourced incident reports. By using our Services, you consent to the data practices described in this policy.

1. IMPORTANT INFORMATION AND WHO WE ARE
Purpose of this privacy policy
This privacy policy aims to give you information on how Ride Club collects and processes your personal data through your use of this application, including any data you may provide through this application when you sign up for an account, participate in a ride, or report an incident.
This application is not intended for children and we do not knowingly collect data relating to children.
It is important that you read this privacy policy together with any other privacy policy or fair processing policy we may provide on specific occasions when we are collecting or processing personal data about you so that you are fully aware of how and why we are using your data.

2. THE DATA WE COLLECT ABOUT YOU
Personal data, or personal information, means any information about an individual from which that person can be identified.
We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
- Identity Data includes first name, last name, username or similar identifier, and profile picture.
- Contact Data includes email address and telephone numbers.
- Location Data includes your real-time geographic location, historical route data, and speed.
- Technical Data includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, operating system and platform.
- Usage Data includes information about how you use our application, participate in rides, and report incidents.

3. HOW WE USE YOUR PERSONAL DATA
We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
- Where we need to perform the contract we are about to enter into or have entered into with you.
- Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.
- Where we need to comply with a legal obligation.

4. DATA SECURITY
We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.

5. YOUR LEGAL RIGHTS
Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
- Request access to your personal data.
- Request correction of your personal data.
- Request erasure of your personal data.
- Object to processing of your personal data.
- Request restriction of processing your personal data.
- Request transfer of your personal data.
- Right to withdraw consent.
"""

fallbackTermsText = """RIDE CLUB TERMS OF SERVICE

Welcome to Ride Club. Please read these Terms of Service carefully before using our application.

1. ACCEPTANCE OF TERMS
By accessing or using the Ride Club application, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.

2. DESCRIPTION OF SERVICE
Ride Club provides real-time navigation, group ride coordination, and crowdsourced road incident reporting.

3. USER RESPONSIBILITIES
- You must follow all local traffic laws and regulations.
- The app is a supplementary aid; do not rely solely on it for navigation or safety.
- Do not interact with the app in a way that distracts you from safe driving.
- You are responsible for any content or reports you submit.

4. LOCATION TRACKING
By using the app, you consent to sharing your location data with your group members during active rides.

5. TERMINATION
We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
"""

try:
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    # Insert Privacy Policy
    cur.execute(
        "INSERT INTO cms_policies (type, content, version, is_published, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s)",
        ('privacy', fallbackPrivacyText, 1, True, datetime.now(), datetime.now())
    )
    
    # Insert Terms of Service
    cur.execute(
        "INSERT INTO cms_policies (type, content, version, is_published, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s)",
        ('terms', fallbackTermsText, 1, True, datetime.now(), datetime.now())
    )
    
    conn.commit()
    cur.close()
    conn.close()
    print("Successfully inserted default CMS policies!")
except Exception as e:
    print(f"Error: {e}")
