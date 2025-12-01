# User Roles Guide - NFC Business Card Platform

## Overview

The NFC Business Card Platform has a hierarchical role-based access control (RBAC) system with four main user roles. Each role has specific permissions and access to different features of the platform.

---

## 1. USER (Regular User)

### Description
Standard users who create and manage their own digital business cards and profiles.

### Primary Purpose
Individual professionals or business people who want to:
- Create their personal digital business card
- Share their contact information via NFC
- Track who views their profile
- Maintain their professional online presence

### Access & Permissions

#### ✅ Can Do:
- **Profile Management**
  - Create personal profiles (limited by subscription)
  - Edit own profiles
  - Delete own profiles
  - Preview profiles before publishing
  - Generate QR codes for profiles

- **Card Management**
  - Link NFC cards to their profiles
  - Manage card settings
  - Track card tap analytics
  - Activate/deactivate cards

- **Analytics**
  - View personal profile analytics
  - See who viewed their profile
  - Track engagement metrics (views, taps, downloads)
  - Export analytics data for own profiles

- **Subscription**
  - Upgrade/downgrade subscription plans
  - View billing information
  - Manage payment methods

- **Settings**
  - Update personal information
  - Change password
  - Set preferences
  - Upload profile photo

#### ❌ Cannot Do:
- Access other users' data
- View system-wide analytics
- Manage other users
- Create/edit templates
- Access admin dashboard
- Manage organizations
- Invite team members
- Change system settings

### Dashboard Features
- Total profiles created
- Profile views summary
- NFC tap counts
- Recent activity
- Quick actions (Create Profile, View Analytics)

### Use Cases
- Freelancers managing their business card
- Sales representatives tracking networking
- Individual professionals sharing contact info
- Small business owners with personal cards

---

## 2. ORGANIZATION ADMIN (org_admin)

### Description
Users who manage a team or organization's digital business cards and member profiles.

### Primary Purpose
Organization administrators who need to:
- Manage team members' access
- Oversee organization branding
- Track team-wide analytics
- Control organization settings

### Access & Permissions

#### ✅ Can Do (Everything USER can do, PLUS):

- **Organization Dashboard**
  - View organization overview
  - Monitor team usage statistics
  - Track organizational limits (users, cards, storage)
  - See subscription status

- **Team Management**
  - Invite new team members via email
  - Assign roles (member/admin) to team members
  - Remove members from organization
  - View all team members and their status
  - Update member roles and departments

- **Organization Settings**
  - Update organization information (name, description)
  - Configure contact details
  - Set organization address
  - Manage subdomain settings

- **Branding & Customization**
  - Upload organization logo
  - Set brand colors (primary/secondary)
  - Add custom CSS for organization profiles
  - Configure custom domain
  - Apply consistent branding across team profiles

- **Security & Access Control**
  - Enable/disable user registration
  - Require email verification
  - Set default user roles
  - Enable two-factor authentication for team
  - Manage custom domain permissions

- **Organization Analytics**
  - View team-wide profile performance
  - Track organization usage metrics
  - Monitor card distribution
  - See member activity

- **Member Profiles**
  - View all team member profiles
  - Apply organization templates to member profiles
  - Ensure brand consistency

#### ❌ Cannot Do:
- Access system-wide admin functions
- Manage users outside their organization
- Create global templates
- View other organizations' data
- Change platform settings
- Access super admin features

### Dashboard Features
- Team member count and limits
- Active cards vs. total allowed
- Profile usage statistics
- Storage usage
- Quick actions (Invite Member, Manage Team, Settings)
- Recent team activity

### Organization Structure
```
Organization Admin (org_admin)
├── Settings
│   ├── General Info
│   ├── Branding
│   └── Security
├── Team Members
│   ├── Owner (highest authority)
│   ├── Admin (can manage members)
│   └── Member (standard access)
└── Resources
    ├── Profiles
    ├── Cards
    └── Analytics
```

### Use Cases
- HR managers controlling company business cards
- Marketing teams ensuring brand consistency
- Enterprise teams with multiple employees
- Organizations needing centralized control
- Companies with branded digital cards

---

## 3. ADMIN (Platform Administrator)

### Description
Platform administrators who manage the entire system, all users, and platform-wide settings.

### Primary Purpose
System administrators responsible for:
- Managing all platform users
- Overseeing system health
- Creating and managing templates
- Monitoring system-wide analytics
- Handling user support issues

### Access & Permissions

#### ✅ Can Do (Everything ORG_ADMIN can do, PLUS):

- **User Management (All Users)**
  - View all users across all organizations
  - Create users manually
  - Edit any user's information
  - Delete users
  - Change user roles
  - Reset user passwords
  - View user activity logs

- **Profile Management (All Profiles)**
  - Access all profiles on the platform
  - Edit any profile
  - Delete any profile
  - Create profiles for any user
  - Bulk update profiles
  - Bulk delete profiles
  - Apply templates to any profile

- **Template Management**
  - Create platform-wide templates
  - Edit existing templates
  - Delete templates
  - Set premium/free status
  - Categorize templates
  - View template usage statistics
  - Apply templates to user profiles

- **System Analytics**
  - View platform-wide statistics
  - Monitor total users, profiles, cards
  - Track system growth metrics
  - Analyze user engagement across platform
  - Export system reports
  - View revenue/subscription metrics

- **Card Management (All Cards)**
  - View all NFC cards in system
  - Manage card assignments
  - Track card analytics
  - Deactivate/reactivate cards
  - Generate direct URLs for cards

- **Direct URL Management**
  - Generate custom slugs for profiles
  - Manage URL redirects
  - Create QR codes for any profile

- **Organization Oversight**
  - View all organizations
  - Monitor organization usage
  - Assist with organization issues
  - Enforce platform policies

#### ❌ Cannot Do:
- Modify core platform code
- Access server infrastructure (handled by Super Admin)
- Change critical system configurations
- Some advanced security settings

### Admin Dashboard Features
- Total users (with growth trends)
- Total profiles created
- Active organizations
- System-wide analytics
- Recent user registrations
- Profile activity feed
- Quick admin actions

### Use Cases
- Platform support staff
- User management teams
- Content moderators
- Customer success managers
- Technical support administrators

---

## 4. SUPER ADMIN (super_admin)

### Description
The highest level of access with complete control over the entire platform, including system configuration and infrastructure.

### Primary Purpose
Platform owners and senior technical staff who:
- Have unrestricted access to everything
- Manage critical system settings
- Handle infrastructure concerns
- Make platform-wide decisions
- Emergency access for critical issues

### Access & Permissions

#### ✅ Can Do (EVERYTHING, including):

- **All Admin Capabilities**
  - Everything that regular Admin can do
  - No restrictions on any feature

- **System Configuration**
  - Modify platform settings
  - Configure email services
  - Set up payment gateways
  - Manage API keys
  - Configure CDN settings
  - Database management access

- **Security & Compliance**
  - Manage platform security settings
  - Configure two-factor authentication policies
  - Set up IP whitelisting
  - Audit logs access
  - Security incident response
  - Data privacy controls

- **Infrastructure Management**
  - Server configuration
  - Database backups
  - Performance monitoring
  - Scaling settings
  - Error tracking
  - System health monitoring

- **Financial Controls**
  - Revenue tracking
  - Subscription management
  - Billing configuration
  - Payment processing settings
  - Refund processing

- **Advanced Features**
  - Feature flag management
  - A/B testing configuration
  - Custom integrations
  - API rate limiting
  - Webhook management

- **Emergency Actions**
  - Platform-wide announcements
  - Emergency user access
  - System maintenance mode
  - Data recovery operations
  - Critical security patches

### Super Admin Dashboard
- Complete system overview
- Infrastructure health metrics
- Financial overview
- User growth charts
- System performance metrics
- Security alerts
- Database statistics

### Use Cases
- Platform founders/owners
- Chief Technology Officers (CTO)
- Senior DevOps engineers
- Security officers
- Critical incident response team

---

## Role Hierarchy

```
Super Admin (Highest Authority)
    ↓
  Admin (Platform-wide Management)
    ↓
Organization Admin (Organization Scope)
    ↓
  User (Individual Scope)
```

---

## Permission Comparison Matrix

| Feature | User | Org Admin | Admin | Super Admin |
|---------|------|-----------|-------|-------------|
| **Personal Profiles** |
| Create Own Profile | ✅ | ✅ | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ | ✅ | ✅ |
| Delete Own Profile | ✅ | ✅ | ✅ | ✅ |
| View Own Analytics | ✅ | ✅ | ✅ | ✅ |
| **Organization Features** |
| Organization Dashboard | ❌ | ✅ | ✅ | ✅ |
| Invite Team Members | ❌ | ✅ | ✅ | ✅ |
| Manage Team | ❌ | ✅ | ✅ | ✅ |
| Organization Settings | ❌ | ✅ | ✅ | ✅ |
| Branding Controls | ❌ | ✅ | ✅ | ✅ |
| Organization Analytics | ❌ | ✅ | ✅ | ✅ |
| **Platform Management** |
| View All Users | ❌ | ❌ | ✅ | ✅ |
| Edit Any User | ❌ | ❌ | ✅ | ✅ |
| Delete Any User | ❌ | ❌ | ✅ | ✅ |
| View All Profiles | ❌ | ❌ | ✅ | ✅ |
| Edit Any Profile | ❌ | ❌ | ✅ | ✅ |
| Template Management | ❌ | ❌ | ✅ | ✅ |
| System Analytics | ❌ | ❌ | ✅ | ✅ |
| Bulk Operations | ❌ | ❌ | ✅ | ✅ |
| **System Configuration** |
| Platform Settings | ❌ | ❌ | ❌ | ✅ |
| Security Config | ❌ | ❌ | ❌ | ✅ |
| Infrastructure Access | ❌ | ❌ | ❌ | ✅ |
| Database Management | ❌ | ❌ | ❌ | ✅ |
| Financial Controls | ❌ | ❌ | ❌ | ✅ |
| Emergency Actions | ❌ | ❌ | ❌ | ✅ |

---

## Data Access Scope

### User
- **Scope**: Own data only
- **Visibility**: Personal profiles, cards, analytics

### Organization Admin
- **Scope**: Organization data
- **Visibility**: All team members, organization profiles, team analytics
- **Boundary**: Cannot see other organizations

### Admin
- **Scope**: Platform-wide
- **Visibility**: All users, profiles, organizations, templates
- **Boundary**: Cannot modify critical system settings

### Super Admin
- **Scope**: Unlimited
- **Visibility**: Everything including system configuration
- **Boundary**: None

---

## Typical User Journeys

### User Journey
1. Register account
2. Verify email
3. Create first profile
4. Link NFC card
5. Share with contacts
6. View analytics
7. Upgrade subscription for more features

### Organization Admin Journey
1. Create organization account
2. Set up organization branding
3. Configure organization settings
4. Invite team members
5. Assign roles to members
6. Monitor team usage
7. Ensure brand consistency
8. Track organization analytics

### Admin Journey
1. Access admin dashboard
2. Monitor new user registrations
3. Review and approve templates
4. Help users with profile issues
5. Manage reported content
6. Run analytics reports
7. Assist organization admins

### Super Admin Journey
1. System health monitoring
2. Configure platform settings
3. Manage infrastructure
4. Handle critical issues
4. Review financial metrics
5. Plan system scaling
6. Implement new features
7. Security audits

---

## Role Assignment

### How Roles are Assigned

1. **User** - Default role for all new registrations
2. **Org Admin** - Assigned when:
   - Creating an organization (becomes owner)
   - Promoted by organization owner
   - Invited as admin to organization

3. **Admin** - Manually assigned by Super Admin
   - For support staff
   - Customer success team
   - Platform moderators

4. **Super Admin** - Manually assigned by existing Super Admin
   - Reserved for platform owners
   - Senior technical staff
   - Very limited number of accounts

---

## Security Considerations

### User
- Standard authentication
- Email verification recommended
- 2FA optional

### Organization Admin
- Enhanced authentication
- Email verification required
- 2FA recommended
- Audit logs for team changes

### Admin
- Strong authentication required
- Email verification mandatory
- 2FA mandatory
- All actions logged
- IP restrictions recommended

### Super Admin
- Maximum security required
- Email verification mandatory
- 2FA mandatory
- All actions logged and monitored
- IP whitelist enforced
- Session timeouts reduced
- Separate audit trail

---

## Best Practices

### For Users
- Keep profile information current
- Use strong passwords
- Enable 2FA for security
- Monitor analytics regularly

### For Organization Admins
- Set clear team policies
- Regular team access reviews
- Enforce brand guidelines
- Monitor usage limits
- Train team members

### For Admins
- Regular system health checks
- Prompt user support
- Fair content moderation
- Document decisions
- Maintain user privacy

### For Super Admins
- Minimal number of accounts
- Regular security audits
- Document all system changes
- Emergency response procedures
- Backup and recovery plans

---

## Summary

The four-tier role system provides:

1. **Flexibility** - Different users can have appropriate access levels
2. **Security** - Prevents unauthorized access to sensitive features
3. **Scalability** - Supports individual users to large organizations
4. **Control** - Centralized management for organizations and platform
5. **Clarity** - Clear separation of responsibilities

Each role builds upon the previous one, ensuring users have the permissions they need without unnecessary access to features they don't require.
