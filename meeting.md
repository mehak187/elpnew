Pasted markdown(3).md
File
btao kia kia krna h

Maine meeting notes review ki hain. Is meeting ke according ELB/Yands Law system ke liye mainly ye kaam karna hai:

1. Existing data clean karna
System mein jo wrong/extra data aur duplicate projects hain unko delete/clean karna hai.
2. Pehle sirf Running Cases par kaam

Client ne kaha hai ke sab kuch ek sath nahi karna. Pehle Running Cases module complete/test karna hai, phir next modules. Basic focus initially:

Basic Data
File Data
3. AI Search / Case Assistant

Filters ki jagah ya alongside ek AI search box banana hai jahan user normal language mein pooch sake, for example:

“Show me cases for X which are still in primary stage”

AI relevant cases ko table mein filter karke show kare.

4. Update se automatic Task creation

Case update mein agar user likhe:

“Next hearing – prepare our reply”

to system/AI us update ko samajh kar automatically task create kare aur follow-up ke liye assign/show kare.

5. Email → Case + OneDrive automation

Jab client ki new case email aaye to ideally:

Email read ho
AI/data extraction se case automatically create ho
Client name aur relevant information fill ho
Email/document OneDrive mein bhi save ho

Ye Microsoft 365/OneDrive aur third-party integration ke through hoga.

6. AI models research/selection

Client multiple AI models consider kar raha tha, lekin meeting mein clear tha ke pehle research karke decide karna hai kaunsa kis task ke liye suitable hai. Copilot alone sufficient nahi samjha gaya.

7. UI/Layout changes

Running case page ka layout revise karna hai. Client ne kaha ke implementation se pehle woh changes/final requirements batayega, phir development start karni hai.

8. Backend + deployment
Is system ke liye proper backend create karna hai.
Existing/server infrastructure par deploy karna discuss hua.
New domain Yands Law ke naam se secure/buy kiya gaya.
9. Admin panel / SaaS structure

System future mein dusre law firms ko bhi sell karna hai, isliye Admin Dashboard banana hai jahan:

Kitne customers/law firms hain
Kaun active hai
Subscription expiry
Payment status
AI usage/limits

manage kiye ja saken.

10. Subscription & payments

Subscription options rakhne hain, for example:

3 months
6 months
9 months
12 months
2 years / 3 years

Aur recurring/automatic payment deduction ka method implement karna hai.

Mere hisaab se immediate priority

Phase 1:

Data clean
Running Cases UI final
Basic Data + File Data
Backend/database structure

Phase 2:
5. AI Case Search
6. Update → Auto Task Creation
7. Testing

Phase 3:
8. Email → Case automation
9. OneDrive integration
10. AI model selection/integration

Phase 4:
11. Admin panel
12. Multi-company/SaaS architecture
13. Subscription & recurring payments

Agar chaho to main ab is meeting ko 
proper developer task list mein convert kar dun — yani har task ke saamne frontend, backend, AI/integration aur estimated complexity bhi likh dun.

detail m aik aik point btao

Bilkul. Main meeting ke har point ko exactly meeting ke context mein, easy Urdu/Roman Urdu mein explain karti hun — taake tumhe clear ho jaye client kya chahta hai, system mein kya already hai, aur humein exactly kya develop/change karna hai.

1. Sab se pehle: Existing data delete/clean karna

Meeting ke start mein client ne kaha ke system mein kuch information galat add ho gayi hai aur 2 projects/data entries ka issue hai.

Usne basically kaha:

Jo extra ya wrong data hai usko delete karo.
System ko clean state mein lao.
Phir proper structure ke according data enter karna start karo.
Humein kya karna hai?

Pehle check karna hai:

Konsay projects/cases galat hain?
Konsi test entries hain?
Konsa duplicate data hai?
Kya sirf specific records delete karne hain ya related data bhi?

Important: Meeting se exact database deletion rules specify nahi huay. Sirf itna clear hai ke client unwanted/wrong information delete karwana chahta hai.

2. Poora system ek sath nahi banana — pehle Running Cases

Client ne clearly kaha ke hum one by one kaam karein.

Pehla focus:

Running Cases

Yani currently jo cases chal rahe hain, unka module pehle complete karna hai.

Usne kaha ke abhi pehle sirf do main cheezein important hain:

A. Basic Data

Ye case ki basic information hogi.

Example structure, meeting ke terminology ke mutabiq:

Case/client information
Basic case details
Jo information file open karte waqt required hoti hai
B. File Data

Case/file se related detailed information.

Client ne kaha ke:

Pehle Basic aur File Data complete karo.

Uske baad test karenge. Agar sab sahi hua to phir next sections/modules par jayenge.

Humein kya karna hai?

Running Case module ka:

Current structure review
Basic Data identify
File Data identify
Backend/database ensure
Add/edit/view functionality
Testing

Phir next module.

3. AI se Case Search — normal filters ki jagah intelligent search

Ye meeting ka ek important feature hai.

Abhi normally user filters use karta hoga:

Case status
Client
Category
Stage
Etc.

Lekin Shakaib ne propose kiya ke filters ki jagah ya unke alternative ke taur par ek AI button/search interface ho.

User AI ko normal language mein likhe.

Example:

Client bola:

Mujhe woh cases chahiye jo particular category ke hain aur abhi primary stage mein hain.

AI ko user ka sentence samajhna hoga.

Phir system:

User ki query samjhe.
Relevant filters/conditions nikale.
Database mein cases search kare.
Matching cases ki list/table return kare.

Client specifically chahta hai ke result table mein show ho.

Is feature ka example

User likhe:

Show me all running cases for ABC which are still in primary stage.

AI internally samjhe:

status = running
client/category = ABC
stage = primary

Aur matching records table mein show kare.

Ismein development kya hogi?
AI input box
User natural language query
AI query interpretation
Safe database filtering/search
Result table

Important: Meeting mein exact AI architecture decide nahi hua. Client aur team ne pehle suitable AI/model choose karne ki baat ki.

4. Case Update ko samajh kar automatic Task banana

Ye doosra important AI feature hai.

Abhi case mein ek Update section hai.

Client example deta hai:

Next hearing for our reply.

Yani kisi case ke update mein user ye likhta hai.

Client chahta hai system automatically samjhe:

Ye sirf normal update nahi hai.
Ismein ek action required hai.
Humein reply prepare karna hai.
Isliye task create hona chahiye.

System phir automatically task bana de.

Example flow

User case update mein likhta hai:

Next hearing on 25 August. Prepare our reply.

AI/system:

Step 1: Text read kare.

Step 2: Samjhe ke action required hai:

Prepare reply

Step 3: Agar date detect ho:

25 August

to due date bhi set kar sakta hai.

Step 4: Task create kare.

Example:

Task: Prepare reply
Related Case: Case #123
Due Date: 25 August
Status: Pending
Client ki expectation

Case updates automatically monitor hon aur important actions task management system mein aa jayen.

5. Email aaye → Automatically Case create ho

Client ka ek bada idea ye hai ke jab kisi client ki new email aaye, system manually copy/paste ke baghair kaam kare.

Client ka desired flow:

Step 1

Client email bheje.

Example:

Please register this new case...

Step 2

System email receive/read kare.

Step 3

Relevant information identify kare:

Client name
Case information
Subject
Other details
Step 4

ELB system mein automatically case/file create ho.

Client ne specifically kaha ke information direct system mein open/create ho.

6. Email/document ko OneDrive mein bhi save karna

Client Microsoft 365 use kar raha hai aur uske paas:

Email
OneDrive
Microsoft 365 environment

Uski requirement hai:

Email se data system mein bhi jaye

Aur

Related document/file OneDrive mein bhi save ho.

Yani possible flow:

Client Email
      ↓
Email Processing
      ↓
AI/Data Extraction
      ↓
Create Case in ELB
      ↓
Save attachment/document in OneDrive
      ↓
Store file reference/link with case

Meeting mein Shakaib ne isay third-party integration kaha aur mention kiya ke Drive, WhatsApp ya other third-party services ki integration mein issues aa sakte hain. Client ne kaha phir bhi start aur try karna chahiye.

Ismein exact development scope
Microsoft 365 integration
Email access
New email processing
Attachment handling
OneDrive upload
Case creation
Error handling

Lekin meeting mein exact trigger mechanism — webhook, polling ya koi specific Microsoft service — decide nahi hua.

7. AI model choose karna

Client pehle Copilot ka naam le raha tha.

Lekin discussion mein Shakaib ne kaha:

Copilot will not handle tasks like this.

Phir client ne idea diya ke multiple AI tools/models consider kiye ja sakte hain, jaise:

ChatGPT
Copilot
Gemini
Claude/other model

Idea ye tha ke pehle dekho kis task ke liye kaunsa AI best hai.

Important baat

Meeting mein ye final nahi hua ke:

"Hum definitely 4 AI models integrate karenge."

Client ne idea diya tha ke multiple models use/test kiye ja sakte hain.

Isliye immediate task:

AI research/POC

Check karna:

Feature	AI ki requirement
Natural language case search	Query understanding
Update → task	Information extraction
Email → case	Email/document extraction
General AI assistant	Conversational reasoning

Phir decide karna ke implementation mein kya use hoga.

8. Existing Running Case UI/layout change karna

Meeting mein client screen dekh kar Running Case page ke layout par baat kar raha tha.

Usne kaha ke:

Jo current structure hai usmein kuch changes chahiye.
Kuch fields/sections ka arrangement change hoga.
Arabic name ke related bhi change discuss hua.
+ button remove karne ki baat hui.

Client ne kaha ke pehle woh properly soch kar final changes batayega.

Usne essentially kaha:

Mujhe ek din do, main soch loon ke mujhe kya changes chahiye, phir tum development start karna.

Iska matlab

Abhi blindly new layout banana nahi hai.

Pehle:

Client final UI changes de.
Confirm kare.
Phir frontend/backend structure uske according modify ho.
9. Backend create karna

Shakaib ne meeting mein kaha:

I will create a backend for it.

Aur client se questions isliye pooch raha tha kyun ke backend ko future requirements ke according design karna hai.

Backend mein kya sochna hoga?

Because ye future mein SaaS ban sakta hai:

Users
Companies/law firms
Cases
Files
Updates
Tasks
AI usage
Subscription
Payments

Isliye database structure future-proof hona chahiye.

10. Same system future mein dusre law firms ko sell karna

Ye bohat important point hai.

Shakaib ne kaha:

We will be selling this to other people.

Client ne agree kiya.

Yani system sirf Yands Law ka internal system nahi rehna chahiye.

Future mein:

Yands Law
    │
    ├── Company A
    │      ├── Users
    │      └── Cases
    │
    ├── Company B
    │      ├── Users
    │      └── Cases
    │
    └── Company C
           ├── Users
           └── Cases
Important requirement: Data separation

Har company ka data separate hona chahiye.

Company A:

Company A ke cases dekhe

Company B:

Company B ka data dekhe

Ek company doosri company ka data na dekh sake.

Ye multi-tenant architecture ki direction hai, although meeting mein technical term "multi-tenant" use nahi hua.

11. Super Admin / Admin Dashboard

Agar system dusri companies ko sell karna hai to ek central admin chahiye.

Shakaib ne explain kiya ke admin dashboard se dekha ja sake:

Kitne users/customers system use kar rahe hain
Kis ka subscription active hai
Kis ne payment ki
Kitna subscription time remaining hai

Client ne is concept ko accept kiya.

Admin panel mein future features
Dashboard


Companies
Users
Subscriptions
Payments
AI Usage
Plans
System Settings

Exact screens meeting mein final nahi kiye gaye, lekin subscription/customer management requirement clear hai.

12. Subscription system

System ko rent/subscription model par sell karna hai.

Client ne kaha ke options ho sakte hain:

3 months
6 months
9 months
12 months
2 years
3 years

Aur short-term plan ka price different ho sakta hai.

Example
3 Months Plan
6 Months Plan
1 Year Plan
2 Years Plan
3 Years Plan

Har company apna plan choose kare.

System track kare:

Start date
End date
Active/inactive
Payment status
13. AI usage ko limit karna

Client ne discussion mein kaha ke AI usage ko limit bhi karna hoga.

Ye important hai kyun ke AI APIs ka cost hota hai.

Example:

Basic Plan
100 AI requests/month


Professional Plan
500 AI requests/month


Enterprise
Custom limit

Meeting mein exact limits ya pricing final nahi hui, sirf AI usage limit karne ki need discuss hui.

14. Automatic/Recurring Payment

Shakaib aur client subscription payment par discuss kar rahe thay.

Requirement ye thi ke system mein aisa payment method ho jahan recurring/automatic deduction possible ho.

Client ne bank card ka mention kiya, lekin Shakaib ne clarify kiya ke humein simple card number nahi chahiye; humein aisa mechanism chahiye jahan automatically deduct ho sake.

Desired flow
Company subscribes
       ↓
Payment method authorized
       ↓
Subscription active
       ↓
Renewal date arrives
       ↓
Automatic payment
       ↓
Subscription extended

Lekin exact payment gateway/provider meeting mein final nahi hua.

15. Domain

Meeting mein new domain discuss hua aur Yands Law ke naam se domain secure/buy karne ki baat hui.

Transcript mein:

yands.om existing/general/public use ke liye mention hua.
Yands Law ke naam se separate domain discuss/buy kiya gaya.

Iska exact deployment configuration meeting transcript se clear nahi hai.

16. Existing system ki branding/logo

Client ne clear kiya ke:

Current system kisi doosre law firm se related/similar structure use kar raha ho sakta hai.
Lekin new system mein sirf logo change nahi, proper branding separation honi chahiye.
Existing aur Yands system ka unwanted connection nahi hona chahiye.

Shakaib ne kaha ke woh isko handle karega.

17. Development approach — One by One

Client ka overall development method ye hai:

STEP 1
Running Cases
↓
Test
↓
STEP 2
Next main section/report
↓
Test
↓
STEP 3
Next module
↓
Test

Yani client nahi chahta ke hum saare modules ek sath change karein.

Pehle ek section:

Develop
Test
Client review
Fix

Phir next section.

Meri understanding mein tumhara actual immediate kaam

Agar hum meeting ko "abhi kya start karna hai?" ke perspective se dekhein, to immediate kaam ye hai:

🔴 Priority 1 — Current system clean
Wrong/extra data remove.
🔴 Priority 2 — Running Case finalize
Client se final UI/field changes lena.
Basic Data finalize.
File Data finalize.
🔴 Priority 3 — Backend structure

Backend ko aise banana ke future mein:

Multiple companies
Multiple users
Cases
Tasks
AI
Subscriptions

support ho saken.

🟡 Priority 4 — AI Proof of Concept

Pehle test:

Natural language → Case Search
Case Update → Task
🟡 Priority 5 — Microsoft integration

Uske baad:

Email receive/read
Email se case data
OneDrive document save
🟢 Future Phase
Admin panel
SaaS companies
Subscription plans
Recurring payments
AI limits

Sab se important baat: Meeting ke according pehle Running Cases ko dynamic/backend ke sath complete karke test karna hai. Uske baad AI aur baqi modules ko step-by-step implement karna hai.

Impromptu Zoom Meeting - August 12

VIEW RECORDING - 35 mins (No highlights)




@0:03 - Mehak Amir

So we were just talking Fathom, Muhammad Shakaib, Mehak Amir, and Shakaib, Amir, and Shakaib, Mehak Amir, and Shakaib, Mehak Amir, we were just talking about Fathom Shakaib is the other woman.




@0:43 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

We Fathom, Fathom Shakaib.




@0:46 - Mehak Amir

talking about Fathom. It's Yais,




@1:03 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Evo, Uddes Freya!




@1:05 - Mehak Amir

Salmika, Mehak are because it session ?




@1:09 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

It's not your 근데, with salmikanom .




@1:34 - Mehak Amir

Do you research from the personrable ?




@1:40 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

How come the personrable? the group




@2:00 - Mehak Amir

We were just talking about How do get to We won't the group.




@2:11 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

do get to We group.




@2:18 - Mehak Amir

That's how we get to group.




@2:21 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

We get to the group. That's why people say that going to be violated, right?




@2:32 - Mehak Amir

Mm-hmm. I'm to be I'm happy to here. Hmm?




@2:44 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

I'm happy to be here. I'm happy to be here. Imran, think we about Fathom Shakaib, Shakaib, but was talking Fathom.

I don't about Fathom and Shakaib.




@3:20 - Mehak Amir

We've been Fathom and Welcome Fathom and Shakaib. Fathom, you're here to the best Well, Thank Hi, my brother.




@3:42 - Mohammed yands

Thank you very How you? How was your family?




@3:47 - Mehak Amir

How was your husband? Fine.




@3:54 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Fine. Okay.




@4:00 - Mohammed yands

Same what I don't do in WhatsApp, okay? We can have now, what we have now, okay, this is good system.

It's more than what we have now, okay? Which system, which system we have for systems?




@4:15 - Mehak Amir

ELB system, ELB system, main system.




@4:20 - Mohammed yands

Yeah, this is, this meeting only for ELB.




@4:24 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Okay.




@4:26 - Mohammed yands

Okay. For Mehak, for Taraz. Please, can you delete all data there?




@4:37 - Mehak Amir

Yeah.




@4:38 - Mohammed yands

Yeah, you know, because I don't know who is adding some information, it's wrong. Okay? There is two projects. Okay?

Someone else, I think maybe we add by Mehak. So it is, okay, only delete, but they have information there, delete.




@4:59 - Mehak Amir

create, we this Only that. Okay.




@5:06 - Mohammed yands

For ELB, okay, again, okay, what I will say for that, okay, we can get money from this side, okay, if we make something, wow, because for English, there is, okay, I don't know the name, okay, there is, okay, so, same, told you last time, okay, many friends, they asked me, will you finish, will you finish, but what do they ask me, the normal thing, okay, only for management, okay, this case is here, go there, okay, here, something like normal mean, what I think now, what we can do by AI.




@5:56 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

We can do a lot of things.




@6:00 - Mohammed yands

Yeah, number one, now what we have, I think in this site, we have for case management, okay, and also we have finance management, and also for HR, okay, three things we have here.




@6:19 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Let me open that up.




@6:21 - Mohammed yands

Okay. Shakaib, you know what I want from this, from the AI, okay. with uh because i will use uh maybe that uh co-by-dodge and we have okay co-by-dodge because we have 365 you know for i have one drive i have email with 365 only we use that so maybe one of them someone with ATP don't use one okay you can use many one okay so we will pay for this for this which one is better okay it's good for you you have company i don't have you know you know my idea when we receive uh email from client okay new case they said please follow this case okay or register this case here i direct they will take this email okay they will take this email and they

SCREEN SHARING: Muhammad started screen sharing - WATCH

Open file here in this system directly, okay, name, client, everything directly, they will open, also at the same time, they will open file in one drive, they keep this as document there, you know, your smile, I don't know why, okay, but what I read until now, okay, there is, we can't do that, it's not difficult to me.




@8:28 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

It's third party integration.




@8:30 - Mohammed yands

What?




@8:32 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Third party integration.




@8:34 - Mohammed yands

I don't know about this, okay, so now we start.




@8:38 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Let me tell, let me explain, drive the other things, everything we can do, okay, but you have experience with WhatsApp, what happened when we tried to use WhatsApp, correct?

So, we will integrate that, that's not a big deal, but know. about are you You have to remember that when we use third-party applications like Drive, like WhatsApp, like anything else, they create some problems that we have to face, okay?




@9:13 - Mohammed yands

Okay, no problem, okay, we start.




@9:16 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Be ready for that.




@9:19 - Mohammed yands

There is a problem, okay, there is some issue, okay, but we can start, we can try.




@9:24 - Mehak Amir

Yeah.




@9:25 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

We will do.




@9:26 - Mohammed yands

Brother, okay, I want to tell something. This system, we can use it like what we have now, we can use it.

If you accept that, if you say, Muhammad, no, if you want to make, I mean, with AI, okay, we will support you.




@9:46 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

I will do.




@9:47 - Mohammed yands

This is about you.




@9:50 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Okay, I will do it.




@9:53 - Mohammed yands

Okay, so can you go to a running case?




@9:57 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Yeah, you know, I want. know, So instead of filters, here will be a button. You will ask AI what you want, and it will show you the exact case, correct?




@10:41 - Mohammed yands

Yes. Maybe I ask him, I want a case for bag mask out, okay? Which is in primary, okay? Which is still in primary case.

So there, they will give me. What I ask AI, they will give me in table, I will see in table.

This is Mehak. Can write this?




@11:05 - Mehak Amir

Can you what?




@11:07 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Licklo, Licklo, Licklo.




@11:09 - Mehak Amir

Oh, sorry. Yes, I can write.




@11:12 - Mohammed yands

Okay, this is number one.




@11:13 - Mehak Amir

We are recording the video, don't worry.




@11:16 - Mohammed yands

Okay, number two, there is one box for update. Right? Can you click anyone there? Yeah, go down, down, down, There is update, right?

So if I write this update, next hearing for our reply. Okay, system direct, what they make, direct, they will give me the task.

Direct. Okay, I will see the task there. And they will follow. Why? Because they know there is our reply.

And again, she gave a smile. You know, when you smile, I ask myself, it's difficult, or it's easy, or...




@12:00 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

What? It's challenging. Interesting.




@12:06 - Mohammed yands

Okay, we can do that. If this team, okay, me and you and Mehak, okay, we didn't take this challenge.




@12:15 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Who is going to do? Yeah, I'm just thinking about what I have to do with this thing, okay?




@12:24 - Mohammed yands

Okay, but I think we can start, okay, one by one. Number one, we choose which AI we can use.

Okay, number one, we try to make this is, okay, the dynamic, only this big, dynamic big, okay? After that, which also, which AI we can, okay, main application, we can use it also here.

We can search. Okay, we're talking with me. Okay, we're thinking about it.




@12:51 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Copilot will not be for this one.




@12:53 - Mohammed yands

Sorry?




@12:55 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Copilot will not handle tasks like this.




@13:00 - Mohammed yands

Oh, see, you know, I don't know anything about this, okay, but I have support, okay, AI, I ask, I ask him, okay, you know, two hours, I take my car, then I talk with him, so which, which AI is good, think, Muhammad, don't use one, okay, you can use it manual, this for this, this for this, this for this, so when you ask something, okay, which one is good for you, they will support you, okay, after six months, you can see which one you use it more, so other one you can step, you pay for this one, who will work with you is good, okay, we will add, like, chat GPT, we will add, copilot, we will add Gemini, we will add flawed, okay, we will use four models for this one, okay, when we use multiple models, we have to understand




@14:00 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

So, I will need to change the layout aspect.




@14:04 - Mohammed yands

Okay, so, good. So, number one, we will work for this case, okay, a running case, only running cases. When we finish, everything is clear, okay, we'll go to other bank.

What mean report? Why I add there? In report, brother, can you? One by one, one by one, okay, go to, yeah, report.

What we add there in this? This is not report, this is basic data. And basic data, you know, this is information when I open the file and I find the system.

Okay? A report, what I add there, okay? I mean, update, date, and update. It's coming here. See? What I add there is coming here.

So I have here a list.




@15:39 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Okay.




@15:42 - Mohammed yands

See, now this is good. What I see now, it's good. Okay? But we will work one by one. I think number one, we need only two things.

We need basic and file data. Only two. Okay?




@15:58 - Mehak Amir

Okay.




@16:00 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

so we'll test this one okay if it's everything it's okay okay we'll go to second main report okay after that we'll go to okay main other one like this one by one yes i got this point okay so to make it dynamic what i will do is uh i have to upload backend somewhere so i will upload where should i upload it i will upload it in same server for java and start off okay okay good and one other thing we need domain correct we have now you know i have okay yes but we need the new one maybe yes we need okay so if you still find out sorry yes




@17:00 - Mohammed yands

No, no, this is, you know, this is, I have this one, last time, keep me silent, keep me silent, shakaib, I give you, I give you, I ask you to help me, to support me, you see, I will do, I supported you, I supported you, I told you where it is, okay?

You ask me sometimes, I'll give you everything. So, see, this is, this name, okay, yands.om, okay, this is what we have now, I use it, but this is for general, okay, for public.

what about .com already taken ah okay that's why i the first thing i do is i book the domain what about yeah yeah yeah yes okay yes low maybe i'm slow or something like this yes low hello this one with the hands no no i mean no mean okay like loyal you know no fear and no sure okay this is available i'm going to buy it




@19:15 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Yandslaw.legal.




@19:17 - Mohammed yands

No, y-a-n-d-s-l-a-w.




@19:24 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Y-a-n-d-s-l-a-w.




@19:28 - Mohammed yands

Yeah, this one.




@19:37 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

For one year?




@19:38 - Mohammed yands

No. Take for three... Can I click Liam, please? Yeah, three years.




@20:06 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Let me put balance in my card.




@22:18 - Mohammed yands

Shakaib, Mehak, what about final excel sheet I sent it for you for uh yes yes I am on it will update you tonight inshallah and also that you know if there is no invoice okay please give me something okay I click approve okay sure but I don't know if you if you can do that if you can if the admin who is do that so no there is coming approve




@23:00 - Mehak Amir

Yes, I read your messages. Yes, I read your messages.




@23:04 - Mohammed yands

if I add this information, no need again to approve there. But if the other people, okay, it's coming there, okay, so there is option for approval.




@23:17 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Congratulations, we bought it.




@23:19 - Mehak Amir

I will add.




@23:21 - Mohammed yands

Alhamdulillah.




@23:24 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

You know, first thing that we should do is secure this, because sometimes it disappears.




@23:43 - Mohammed yands

Shakaib, don't forget that what I was talking with you before. No, this system don't, okay, bending for us. Okay, because same, everything is same, only the logo.

Okay, they will change it. Now they're using the hands for other lofairm, but they asked for me, so his logo.

Okay, and there are no connection.




@24:05 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

I understand.




@24:07 - Mohammed yands

Yeah, because you asked me this question when we start.




@24:10 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

I understand. I will do it. Don't worry about it.




@24:15 - Mohammed yands

Okay.




@24:21 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

So what I will put it in here with Yawa, correct?




@24:33 - Mohammed yands

Brother, what I do here for Oman, so this is only for Oman. Breeze Drive is different. Okay. Same as I told you, this is gift only.




@24:45 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Yeah.




@24:53 - Mohammed yands

See about Breeze Drive till today. Till today. Today? Yeah. Till today. They don't know how the system is working.

Today, I give them a brief about it, one by one. You know what they say? Wow. I said, now it's wow.

After that, they sent in that document.




@25:20 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

know, the document is coming for me, direct.




@25:31 - Mohammed yands

Before they asked me, okay, what is this, Muhammad? How we can do this? Something like this. But today, okay, I asked him, okay, send it to comment for Mita.

Many times, no one sent it. Today, when I give them brief, okay, and there is AI, they can ask you, ask him, okay?

He said, wow, wow. So now there is control. I said, they're happy. That time they sent it for me, you know how many people, maybe one by one, this one they sent it for me, I didn't say anything, okay, but for that, because I think these two people, they think one, okay, we can't do that, but you know, push it, push it, push it, push it like this, now they like it, they said within 10 days, okay, all information, all data, they will, all data, know, info is something, they will add it.




@26:32 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Yeah, that's great, and I think we have done a lot with that project, I have updated the meta as well, so that hopefully it will get approved as well.

Okay, so what I will do now is, I will create a backend for it, okay?




@26:52 - Mohammed yands

Brother, wait, for this one, can I go around in case again, in case, we are there. Okay, there is one here, you know, here, here.

This side, this side, this side. No, no, no, this side, this side, this side. Brother, this side. Yeah, go, go, go, go, up.

A little bit up, little bit up. Yeah, yeah. Stop, stop. There is a plus. Okay, this big number one.

Okay, this big. Why? Because we start at here. um okay okay the the arabic you know the arabic name here only one no need okay one two three four okay remove plus no need it is one uh i added it okay yeah remove now remove i will think about more you know this is not good uh when you will start entering data then you will think about it then you will tell me no no no brother you know we will do something

Okay, because we know, I know how we work, you know, Muhammad, what we will do, Muhammad, we will start this big, so what you have, okay, change there, tell me before, Fath, give me one day, Muhammad, this is one day for you, okay, think, what do you want to change from here, so I will tell you, before you start, before you make the new change it, I think it's better, one day is enough for me.




@28:24 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Okay, very good with that. Okay, so, so now we have this one, okay, this big, okay, I got it, so I'm getting that, what I will do is, I will also create an admin, okay, okay, admin, you know, for what purpose admin will be, because we will be selling this to other people, correct, we will be selling this system to other people.




@29:00 - Mohammed yands

Yes.




@29:01 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Yes. So we need a dashboard where you can see how many people are using this. Correct?




@29:09 - Mohammed yands

Yes. Sure.




@29:10 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Are they paying you or not? How much time they have left in their subscription? Because every 30 days they have to pay you.




@29:18 - Mohammed yands

Correct? Again?




@29:23 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

After every 30 days, after every month, like you give me salary, those people will give you money to use this.




@29:34 - Mohammed yands

I give him or they give me?




@29:36 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

They give you.




@29:38 - Mohammed yands

Yeah.




@29:38 - Mehak Amir

They give you for using the plate.




@29:41 - Mohammed yands

Brother, for this one, okay, it's like a rent. I will not pay. If anyone asks me to pay this, no, this is not for pay.




@29:50 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

No, they will, it will like a subscription.




@29:54 - Mohammed yands

Every month they have to pay you. Yes. Maybe, maybe monthly, maybe three months. Maybe they take one year, you know, we make option, okay, some people need to give me for the listing, okay, three months, okay, or maybe three months subscription, six months for one year, three, six, nine, twelve, okay, and there is also two years, three years, okay, for three months, it's coming a little bit extra.

Okay, and that, the thing is that we also have to limit the AI, okay, because for… Brother, I don't know anything, this is about you, okay, what are we doing, that is, I told you, we have company, we have company, right, company for IT, now we have, okay, but what I asked my friend, okay, now there is, look for Bangladesh, for Pakistan, we can get visa, now, in Oman, Okay, maybe after, okay, always they make it six months, one year, okay, then they open, but we have company, you can…

When we finish, we can talk about this, but from now thinking, okay, about it, but after how much we will pay, okay, for Oman, for out of Oman, how we can pay for Oman, something like this.




@31:12 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Yeah, so the thing is that I'm just asking these questions because I'm going to create a back end for it, okay?




@31:21 - Mohammed yands

I don't know, it's about you.




@31:25 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

You just think of it as, I want to collect information so that I can start making it accordingly.




@31:33 - Mohammed yands

Okay.




@31:34 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Yeah, so I get that.




@31:37 - Mohammed yands

Also, what do you think about it, okay, maybe that they give me his card, know, bank card. Okay, so we'll get from when you're building the system, okay, you get from there direct, you know, if we start next month, okay.

right indicated. bye. bye! bye.




@32:06 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

You know this one, who it is?




@32:09 - Mohammed yands

Sure, sure, sure. But I don't have a card. If you want, I will contact him to take a card.




@32:15 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

No, we don't need a card. We need this from where you can automatically deduct.




@32:26 - Mohammed yands

Okay. So what do you want from my side now? I will tell you in a bit.




@32:31 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Okay. This thing, as you can see, we have this. When I search payment method in Morocco, there is no.

Okay. See?




@32:49 - Mohammed yands

Okay. Okay.




@32:51 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

See, for Oman, we have it.




@32:56 - Mohammed yands

Yes.




@32:57 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

So we will use this. I'm just trying. I think that everything that I want to do in this, I just want to make it clear, okay?




@33:07 - Mohammed yands

Okay, inshallah. Are you afraid? Is that more than a smarter one? Okay. Yes, Harada. I will get it. Hmm.

Shakaib, Shakaib, it's finished?




@34:40 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Yeah, give me one day for covering up Java and PreStripe. Tomorrow I will start working on this, okay?




@34:48 - Mohammed yands

Okay, Inshallah. So I will start being, okay, check if there is some change, now I will tell you.




@34:55 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Okay.




@34:56 - Mohammed yands

Okay brother, thank you.




@34:58 - Muhammad Shakaib (shakaibishfaq1@gmail.com)

Okay, now I will. I can have one card.




@35:09 - Mehak Amir

Okay.

Close