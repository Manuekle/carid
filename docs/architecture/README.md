# System Architecture

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS + Shadcn/UI
- **State Management**: React Query + Zustand
- **Form Handling**: React Hook Form + Zod
- **Authentication**: NextAuth.js
- **Data Fetching**: SWR for client-side data fetching
- **UI Components**: Custom components built on top of Shadcn/UI
- **Form Validation**: Zod schema validation
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 18+
- **API Routes**: Next.js API Routes
- **Database**: MongoDB with Prisma ORM
- **File Storage**: Vercel Blob Storage
- **Real-time**: Server-Sent Events (SSE)

## Core Features

### Vehicle Management
- **Vehicle CRUD Operations**: Full CRUD operations for vehicle management
- **QR Code Generation**: Dynamic QR code generation for each vehicle
- **Document Management**: Upload and manage vehicle documents
- **Maintenance Tracking**: Track maintenance history and schedules
- **Responsive Design**: Mobile-first responsive layout

### User Roles & Permissions
- **Owner**: Full access to owned vehicles and their data
- **Mechanic**: Access to assigned maintenance tasks
- **Admin**: Full system access

### Data Flow
1. **Vehicle Creation**
   - User submits vehicle details via form
   - Form is validated using Zod schemas
   - Data is sent to `/api/vehicles` endpoint
   - On success, vehicle is created and QR code is generated
   - UI updates to show new vehicle in the list

2. **Maintenance Tracking**
   - Mechanics can view assigned maintenance tasks
   - Owners can track maintenance history
   - Real-time updates for maintenance status changes

### Infrastructure
- **Hosting**: Vercel
- **Database**: MongoDB Atlas
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics

## Database Schema

### User
```prisma
model User {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  name          String
  email         String    @unique
  password      String
  role          Role      @default(OWNER)
  isApproved    Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  cars          Car[]
  maintenance   MaintenanceLog[]
  sentMessages  Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
}
```

### Car
```prisma
model Car {
  id              String          @id @default(auto()) @map("_id") @db.ObjectId
  vin             String          @unique
  licensePlate    String
  brand           String
  model           String
  year            Int
  color           String
  qrCode          String          @unique
  ownerId         String          @db.ObjectId
  owner           User            @relation(fields: [ownerId], references: [id])
  maintenanceLogs MaintenanceLog[]
  documents       Document[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}
```

### MaintenanceLog
```prisma
model MaintenanceLog {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  carId       String    @db.ObjectId
  car         Car       @relation(fields: [carId], references: [id])
  mechanicId  String    @db.ObjectId
  mechanic    User      @relation(fields: [mechanicId], references: [id])
  description String
  status      MaintenanceStatus @default(IN_PROGRESS)
  startDate   DateTime  @default(now())
  completedAt DateTime?
  partsUsed   PartUsage[]
  invoice     Invoice?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Part & Inventory
```prisma
model Part {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  description String?
  price       Float
  stock       Int
  sku         String    @unique
  imageUrl    String?
  usages      PartUsage[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model PartUsage {
  id              String         @id @default(auto()) @map("_id") @db.ObjectId
  maintenanceLog  MaintenanceLog @relation(fields: [maintenanceLogId], references: [id])
  maintenanceLogId String         @db.ObjectId
  part            Part           @relation(fields: [partId], references: [id])
  partId          String         @db.ObjectId
  quantity        Int
  unitPrice       Float
  createdAt       DateTime       @default(now())
}
```

### Document
```prisma
model Document {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  carId       String   @db.ObjectId
  car         Car      @relation(fields: [carId], references: [id])
  name        String
  docType     String
  fileUrl     String
  uploadedAt  DateTime @default(now())
  expiresAt   DateTime?
}
```

### Chat
```prisma
model ChatSession {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  carId       String    @db.ObjectId
  car         Car       @relation(fields: [carId], references: [id])
  messages    Message[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Message {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  chatSessionId   String      @db.ObjectId
  chatSession     ChatSession @relation(fields: [chatSessionId], references: [id])
  senderId        String      @db.ObjectId
  sender          User        @relation("SentMessages", fields: [senderId], references: [id])
  receiverId      String      @db.ObjectId
  receiver        User        @relation("ReceivedMessages", fields: [receiverId], references: [id])
  content         String
  isRead          Boolean     @default(false)
  createdAt       DateTime    @default(now())
}
```

## API Flow

### Authentication Flow
1. User submits login form with email/password
2. Server validates credentials and returns JWT token
3. Token is stored in HTTP-only cookie
4. Subsequent requests include token in Authorization header

### File Upload Flow
1. Client requests signed URL from server
2. Server generates pre-signed URL with Vercel Blob
3. Client uploads file directly to Vercel Blob
4. Server confirms upload and saves file metadata to database

### Real-time Updates
1. Client establishes SSE connection to `/api/events`
2. Server sends events for relevant updates (new messages, status changes)
3. Client updates UI based on received events

## Security Considerations

- All API routes are protected by authentication middleware
- Role-based access control for sensitive operations
- Input validation using Zod schemas
- Rate limiting on authentication endpoints
- CSRF protection for forms
- Secure HTTP headers via Next.js middleware
- File type and size validation for uploads
- Sensitive environment variables are not exposed to the client

## Performance Optimization

- Image optimization using Next.js Image component
- Data fetching with React Query for caching and background updates
- Code splitting with dynamic imports
- Server-side rendering for SEO and initial load performance
- Database indexing for frequently queried fields

## Monitoring and Error Tracking

- Error boundaries for graceful error handling
- Logging of server-side errors
- Vercel Analytics for performance monitoring
- Custom event tracking for key user actions
