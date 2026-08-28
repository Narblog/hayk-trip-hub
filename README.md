# Armenia Stays & Trails

Build a complete, production-ready web platform for Armenia that works similarly to Booking.com, but is focused specifically on Armenian hotels, guesthouses, cabins, villas, apartments, tours and travel experiences.

The platform must be designed as a scalable marketplace with three main user types:

CUSTOMER / TRAVELER

PROPERTY OWNER / HOST

ADMIN

The platform must have a modern, premium, trustworthy travel-industry design. It should feel like a real startup product, not a basic CRUD dashboard.

IMPORTANT:
Do not build only a frontend prototype.
Build the complete application architecture including authentication, database structure, user roles, property management, availability calendar, search/filtering, admin approval workflow and owner dashboard.

Use Supabase as the backend/database/authentication/storage solution.

==================================================

PLATFORM CONCEPT
==================================================

The platform is an Armenian travel marketplace where users can:

Search hotels

Search guesthouses

Search cabins

Search villas

Search apartments

Search resorts

Search tours

Search travel experiences

A traveler enters:

Destination / city / region

Check-in date

Check-out date

Number of guests

The system must return ONLY properties that are available for the selected dates and guest capacity.

The most important functionality is the availability system.

If an owner blocks dates in their calendar, those dates MUST immediately become unavailable in the public search.

Do not simply display all properties and filter visually.

The backend must actually calculate availability from the database.

==================================================
2. TECHNOLOGY

Use:

React

TypeScript

Modern responsive UI

Supabase

Supabase Authentication

Supabase PostgreSQL

Supabase Storage for property images

Row Level Security (RLS)

Modern component architecture

Clean reusable components

Proper loading states

Error handling

Empty states

Mobile-first responsive design

Use a clean architecture so the application can later scale to thousands of properties and users.

==================================================
3. LANGUAGE

The platform must support:

Armenian

Russian

English

Create a language switcher in the header.

All major UI text must support translations.

Do not hardcode the entire interface in one language.

Default language should be Armenian.

==================================================
4. HOME PAGE

Create a premium travel marketplace homepage.

Header:

Logo

Stays

Tours

Experiences

About

Language selector

Login

Register

"List your property" button

Hero section:

Large attractive Armenia travel visual.

Main search component:

[ Where are you going? ]

[ Check-in ]

[ Check-out ]

[ Guests ]

[ Search ]

Destination field must support:

Yerevan

Dilijan

Tsaghkadzor

Jermuk

Sevan

Gyumri

Goris

Tatev

Haghartsin

Lori

Tavush

Syunik

Kotayk

Gegharkunik

etc.

It must also support searching by region/city.

Below the search section show:

Popular destinations

Recommended stays

Popular guesthouses

Cabins in nature

Hotels

Tours

Experiences

Each property card should show:

Main image

Property name

Location

Property type

Guest capacity

Number of bedrooms

Amenities

Rating

Review count

Price per night

"View property" button

==================================================
5. AUTHENTICATION

Implement Supabase authentication.

Users can:

Register

Login

Logout

Reset password

Edit profile

Registration must allow choosing:

"Traveler"

or

"Property Owner"

The account role must be stored in the database.

Admin accounts must have a separate ADMIN role.

Do not allow normal users to manually assign themselves ADMIN.

==================================================
6. CUSTOMER PROFILE

Traveler dashboard should contain:

Profile photo

Full name

Email

Phone

Saved properties

Favorite properties

Viewed properties

Booking/contact history if applicable

Allow travelers to save properties to favorites.

==================================================
7. PROPERTY OWNER REGISTRATION

Property owners must have an owner dashboard.

Owner can:

Create property

Edit property

Upload images

Add property description

Add phone number

Add WhatsApp number

Add Instagram

Add address/location

Select city

Select region

Select property type

Add price

Add guest capacity

Add bedrooms

Add beds

Add bathrooms

Add amenities

Add check-in time

Add check-out time

Add house rules

Add additional information

Property types:

Hotel

Guesthouse

Villa

Cabin

Apartment

Resort

Cottage

Hostel

Glamping

Other

Amenities:

Wi-Fi

Parking

Pool

Jacuzzi

Sauna

BBQ

Kitchen

Air conditioning

Heating

Fireplace

Breakfast

Pet friendly

Washing machine

Mountain view

Forest view

Lake view

Garden

Terrace

Balcony

Owner must be able to upload multiple high-quality images.

Use Supabase Storage.

Allow owner to reorder the images and select a main cover image.

==================================================
8. PROPERTY APPROVAL SYSTEM

VERY IMPORTANT:

When an owner creates a property, it MUST NOT immediately appear publicly.

Property status:

DRAFT

PENDING_REVIEW

APPROVED

REJECTED

SUSPENDED

After submitting a property:

status = PENDING_REVIEW

Admin receives the property in the admin dashboard.

Admin can:

View property

View owner

View images

View contact information

View location

Approve

Reject

Suspend

Request changes

Only APPROVED properties can appear in public search.

==================================================
9. ADMIN DASHBOARD

Create a complete admin panel.

Admin dashboard should include:

Overview:

Total users

Total owners

Total properties

Pending properties

Approved properties

Rejected properties

Active properties

Total tours

Total reviews

Property management:

All properties

Pending approval

Approved

Rejected

Suspended

Admin can:

Approve property

Reject property

Suspend property

Edit property

Delete property

View owner

View property images

View reported properties

User management:

Travelers

Owners

Admins

Admin can:

View users

Suspend users

Activate users

View properties belonging to an owner

Create an audit log for important admin actions.

==================================================
10. MOST IMPORTANT FEATURE — AVAILABILITY CALENDAR

Build a real availability management system.

Every property must have its own calendar.

Owner dashboard:

"Availability Calendar"

Calendar must show:

Available

Blocked

Reserved/contacted dates if later implemented

Past dates

Owner can click one or multiple dates and block them.

Example:

August 15 → blocked
August 16 → blocked
August 17 → available

If owner blocks August 15-17, those dates MUST NOT appear as available in public search.

The availability information must be stored in the database.

Do NOT store availability only in frontend state.

Create proper database tables for:

properties
availability
blocked_dates

or another normalized structure that allows scalable date queries.

The system must support:

Single date blocking

Date range blocking

Unblocking

Recurring availability later if needed

When owner changes availability, the public search must immediately use the updated database state.

==================================================
11. SEARCH AVAILABILITY LOGIC

This is critical.

When a traveler searches:

Destination = Dilijan
Check-in = August 20
Check-out = August 23
Guests = 4

The backend must return properties where:

Property is APPROVED

Property location matches destination/region

Property capacity >= 4

Property is available for EVERY requested night

Property is not blocked for ANY requested date

Property is active

Example:

Traveler searches:

August 20 → August 23

Required nights:

August 20
August 21
August 22

If a property is blocked on August 21:

DO NOT RETURN THAT PROPERTY.

This logic must happen at database/backend level, not just frontend filtering.

Avoid N+1 queries.

Use efficient PostgreSQL queries/functions where appropriate.

Create a reusable availability-check function.

==================================================
12. SEARCH RESULTS PAGE

Create a dedicated search results page.

URL structure should be SEO-friendly.

Example:

/stays/dilijan

or

/search?destination=dilijan&checkIn=2026-08-20&checkOut=2026-08-23&guests=4

Search page layout:

Desktop:

Left side:
Filters

Right side:
Property results

Filters:

Price range

Property type

Guest capacity

Bedrooms

Amenities

Rating

Location

Jacuzzi

Pool

Parking

Breakfast

Pet friendly

Sort:

Recommended

Price low to high

Price high to low

Rating

Most popular

Property cards should have:

Large image

Favorite button

Property name

Location

Rating

Amenities

Capacity

Price

Availability status

View button

Mobile:

Use a sticky search/filter interface.

==================================================
13. PROPERTY DETAILS PAGE

Create a premium property details page.

Example:

/property/forest-panorama

Sections:

Image gallery

Property name

Location

Rating

Description

Amenities

Capacity

Bedrooms

Beds

Bathrooms

House rules

Check-in/check-out

Map

Nearby attractions

Owner information

Contact buttons

Show:

"Contact owner"

Buttons:

Call

WhatsApp

Instagram

Do not expose private owner information to users before property is approved.

Phone number should be visible on approved property pages according to the platform's business model.

Also include:

"Check availability"

Date selector:

Check-in

Check-out

Guests

When dates are selected, show whether the property is available.

==================================================
14. OWNER CONTACT

The initial business model should allow the traveler to contact the property owner directly.

No mandatory platform commission should be required for the initial version.

Property page can display:

Phone

WhatsApp

Instagram

Contact button

Track contact clicks in analytics:

phone click

WhatsApp click

Instagram click

This will later allow the platform to measure leads generated for owners.

==================================================
15. MAP

Integrate a map system.

Each property must have:

latitude

longitude

city

region

Property details page should show the property location.

Search results can optionally have:

List + Map view.

Example:

Left:
Property list

Right:
Interactive map

Property markers should show approximate location.

For privacy/security, allow owner to choose whether exact location is publicly displayed.

==================================================
16. FAVORITES

Travelers can click a heart icon on property cards.

Favorites are saved to their account.

Create:

/favorites

Show all saved properties.

==================================================
17. REVIEWS

Prepare the architecture for reviews.

Reviews should contain:

User

Property

Rating

Comment

Date

Status

Admin moderation should exist.

Only verified/eligible users should eventually be able to leave reviews.

For the first version, implement the database structure and UI so it can easily be activated.

==================================================
18. TOURS & EXPERIENCES

The platform should not be limited to accommodation.

Create a separate marketplace section:

"Tours & Experiences"

Examples:

Hiking

Horse riding

Wine tours

Jeep tours

Cultural tours

Photography tours

Fishing

Rafting

Camping

Cooking experiences

Local food experiences

Monastery tours

Create a separate entity:

tours

Tour owners/guides can create:

Tour name

Description

Images

Location

Duration

Price

Maximum participants

Meeting point

Contact information

Category

Tours should also have an approval workflow:

DRAFT
PENDING_REVIEW
APPROVED
REJECTED
SUSPENDED

Admin approves tours before publication.

==================================================
19. DATABASE ARCHITECTURE

Create a normalized PostgreSQL schema.

At minimum:

profiles

fields:

id
user_id
role
full_name
phone
avatar_url
created_at
updated_at

properties

fields:

id
owner_id
name
slug
description
property_type
city
region
address
latitude
longitude
price_per_night
max_guests
bedrooms
beds
bathrooms
check_in_time
check_out_time
status
main_image_url
created_at
updated_at

property_images

id
property_id
image_url
sort_order
is_cover

amenities

id
name
category

property_amenities

property_id
amenity_id

availability

id
property_id
date
status

Possible statuses:

AVAILABLE
BLOCKED
RESERVED

favorites

id
user_id
property_id
created_at

reviews

id
user_id
property_id
rating
comment
status
created_at

tours

id
owner_id
name
slug
description
category
city
region
location
latitude
longitude
duration
price
max_participants
status
created_at
updated_at

tour_images

id
tour_id
image_url
sort_order

admin_actions

id
admin_id
action
target_type
target_id
notes
created_at

contact_events

id
property_id
user_id nullable
contact_type
created_at

==================================================
20. SECURITY / RLS

Implement Supabase Row Level Security correctly.

Rules:

Traveler:

Can read approved properties

Can edit own profile

Can manage own favorites

Can create eligible reviews

Owner:

Can create own properties

Can edit own properties

Can upload images to own properties

Can manage availability for own properties

Cannot approve own property

Cannot modify another owner's property

Admin:

Full management access

Anonymous visitors:

Can view approved public properties

Cannot access private owner data

Cannot modify database

Never expose Supabase service-role keys in frontend.

==================================================
21. OWNER DASHBOARD

Create a professional owner dashboard.

Sidebar:

Dashboard

My Properties

Add Property

Availability Calendar

Leads / Contacts

Reviews

Profile

Settings

Dashboard cards:

Total properties

Approved properties

Pending approval

Contact requests

Phone clicks

WhatsApp clicks

Instagram clicks

Property table:

Property
Status
Price
Capacity
Views
Contacts
Actions

Actions:

Edit

Calendar

Preview

Disable

==================================================
22. PROPERTY CREATION WIZARD

Do not put every field into one giant form.

Create a multi-step wizard:

Step 1:
Basic information

Step 2:
Location

Step 3:
Capacity

Step 4:
Photos

Step 5:
Amenities

Step 6:
Pricing

Step 7:
Rules

Step 8:
Availability

Step 9:
Preview

Step 10:
Submit for approval

Show progress indicator.

Validate every step.

Do not allow submission with missing required information.

==================================================
23. IMAGE UPLOAD

Use Supabase Storage.

Requirements:

Multiple images

Image preview

Drag and drop

Delete image

Reorder images

Select cover image

Image compression/optimization if possible

Prevent invalid file types.

==================================================
24. RESPONSIVE DESIGN

The platform must work perfectly on:

Desktop

Laptop

Tablet

Mobile

Mobile experience is extremely important.

Navigation on mobile should become a clean bottom navigation or mobile menu.

Search interface must be easy to use with one hand.

Property cards must look excellent on mobile.

==================================================
25. DESIGN DIRECTION

Design should feel like:

Booking.com + Airbnb + modern Armenian travel startup.

But do NOT copy their branding or exact UI.

Use:

Premium typography

Large travel photography

Rounded cards

Soft shadows

Clean spacing

Modern icons

Elegant search bar

High-quality image galleries

Strong CTA buttons

Color palette should communicate:

Armenia

Nature

Mountains

Hospitality

Trust

Use a sophisticated neutral base with a distinctive accent color.

Avoid excessive gradients.

Avoid generic AI-generated dashboard aesthetics.

==================================================
26. SEO

Build SEO-friendly architecture.

Each property should have:

SEO title

SEO description

SEO-friendly slug

Example:

/property/forest-panorama-haghartsin

City pages:

/stays/dilijan
/stays/tsaghkadzor
/stays/jermuk
/stays/sevan

Tour pages:

/tours/dilijan
/tours/yerevan

Use proper:

meta titles

meta descriptions

Open Graph

structured data where appropriate

==================================================
27. IMPORTANT SEARCH EDGE CASES

Handle:

Check-out date cannot be before check-in

Check-in cannot be in the past

Guests must be >= 1

Property capacity must be >= requested guests

Blocked dates

Consecutive blocked dates

Same-day check-in/check-out rules

Property temporarily suspended

Property pending approval

No results

Destination not found

No-results page should say something useful and offer:

Change dates

Change number of guests

Remove filters

Explore nearby destinations

==================================================
28. ADMIN PROPERTY REVIEW PAGE

When admin opens a pending property:

Show:

Property gallery
Property information
Owner information
Location
Price
Amenities
Capacity
Contact information
Description
Rules

Buttons:

APPROVE
REJECT
REQUEST CHANGES

When rejected/requesting changes, admin can add a note explaining why.

Owner should see the rejection/change request inside their dashboard.

==================================================
29. NOTIFICATIONS

Prepare notification architecture.

Events:

Property submitted

Property approved

Property rejected

Property needs changes

New contact

Review received

Create an internal notifications table.

Display notifications in owner dashboard.

==================================================
30. ANALYTICS

Track:

Property views

Search queries

Favorite clicks

Phone clicks

WhatsApp clicks

Instagram clicks

Contact clicks

Admin dashboard should eventually show:

Most viewed properties
Most contacted properties
Popular destinations
Popular dates
Popular property types

==================================================
31. PERFORMANCE

The platform must be designed for scalability.

Do not load every property into the browser.

Use:

Pagination

Database filtering

Efficient queries

Lazy loading images

Optimized image sizes

Proper indexes

Create database indexes for:

property status

city

region

owner_id

availability date

property type

price

max_guests

Availability search must be optimized.

==================================================
32. IMPORTANT BUSINESS LOGIC

The system must distinguish between:

PROPERTY
ROOM

Initially, one property can represent one rentable unit.

However, architect the database so that later we can support:

One hotel
→ multiple rooms
→ different room types
→ different prices
→ separate availability

Do not build the architecture in a way that makes this impossible later.

==================================================
33. FUTURE FEATURES — PREPARE ARCHITECTURE

Do not necessarily implement all of these now, but structure the database and application so they can be added later:

Online booking

Online payments

Platform commission

Promo codes

Discounts

Seasonal prices

Multiple rooms

Multiple properties per owner

Messaging

Push notifications

Email notifications

SMS

Calendar synchronization

Booking.com / Airbnb calendar sync

iCal

Google Maps advanced integration

Armenian dram currency

USD

EUR

Russian ruble

Reviews

Verified properties

Featured properties

Paid promotion

Subscription plans

Advertising

Tour booking

Affiliate system

==================================================
34. CURRENCY

Primary currency:

AMD (Armenian Dram)

Prepare architecture for:

AMD
USD
EUR

Property owners should enter their base price in AMD initially.

==================================================
35. ADMIN SETTINGS

Create an admin settings section.

Admin should eventually be able to manage:

Cities

Regions

Property types

Amenities

Tour categories

Platform settings

Featured properties

Homepage sections

Do not hardcode everything directly into components.

Use database-driven categories where practical.

==================================================
36. INITIAL ADMIN ACCOUNT

Create a secure method for defining the first admin account.

Never expose admin credentials in frontend code.

Admin role must be controlled server-side/database-side.

==================================================
37. UI STATES

Every page must have:

Loading state

Skeleton state where appropriate

Empty state

Error state

Success state

Do not leave blank screens.

For example:

"No available properties found for these dates."

Then provide:

"Change dates"

"Explore nearby"

==================================================
38. DEMO DATA

Create realistic Armenian demo data so the application can immediately be tested.

Include properties from:

Yerevan
Dilijan
Haghartsin
Tsaghkadzor
Sevan
Jermuk
Gyumri
Goris
Tatev

Create realistic property names, descriptions, prices, capacities and amenities.

Use placeholder/demo images only where necessary.

Clearly mark demo data so it can later be removed.

==================================================
39. CRITICAL AVAILABILITY TEST

Before considering the project complete, test this scenario:

Property:
Forest Panorama

Capacity:
8 guests

Dates blocked by owner:

August 15
August 16
August 17

Traveler searches:

August 15 → August 18
4 guests

Forest Panorama MUST NOT appear.

Traveler searches:

August 18 → August 20
4 guests

Forest Panorama SHOULD appear if no other dates are blocked.

Then owner blocks August 19.

Search:

August 18 → August 20

Forest Panorama MUST disappear.

This must work using the real Supabase database.

==================================================
40. FINAL REQUIREMENT

Do not stop after generating the homepage.

Build the complete first version of the application:

Homepage

Authentication

Traveler account

Owner account

Owner dashboard

Property creation

Image upload

Property approval

Admin dashboard

Availability calendar

Real availability search

Search results

Filters

Property details

Favorites

Contact system

Tours architecture

Reviews architecture

Notifications architecture

Supabase database

RLS security

Responsive mobile UI

SEO structure

The application must be functional end-to-end.

Prioritize correctness of the availability/search system and role permissions over decorative UI.

Before finishing, verify that:

Owner can register.

Owner can create a property.

Property starts as PENDING_REVIEW.

Admin can approve it.

Approved property becomes publicly visible.

Owner can block dates.

Blocked dates are stored in Supabase.

Search excludes properties with blocked dates.

Traveler can search by destination, dates and guests.

Traveler only sees suitable available properties.

Owner cannot modify another owner's property.

Normal users cannot access admin functions.

Admin can manage properties and users.

The entire application works responsively on mobile.

Build this as a real production-oriented Armenian travel marketplace, not as a static demo.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hayk-trip-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c060f5f9-a34b-47ca-baa2-4d669dd9933f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
