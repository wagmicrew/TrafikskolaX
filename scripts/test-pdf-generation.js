/**
 * Test script for PDF generation functionality
 * Run with: node scripts/test-pdf-generation.js
 */

const { generateUserDeletionPDF } = require('../lib/pdf/user-deletion-pdf.tsx');
const { savePDFToStorage, generatePDFFileName } = require('../lib/pdf/pdf-storage.ts');

// Mock data for testing
const testData = {
  user: {
    id: 'test-user-123',
    firstName: 'Test',
    lastName: 'Användare',
    email: 'test@example.com',
    phone: '070-123-4567',
    personalNumber: '19901010-1234',
    address: 'Testgatan 123',
    postalCode: '12345',
    city: 'Stockholm',
    role: 'student',
    customerNumber: 'CUST-001',
    inskriven: true,
    workplace: 'Test AB',
    workPhone: '08-123-4567',
    mobilePhone: '070-123-4567',
    createdAt: new Date('2023-01-01'),
  },
  bookings: [
    {
      id: 'booking-1',
      scheduledDate: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'swish',
      totalPrice: '500.00',
      notes: 'Test lektion',
      isCompleted: true,
      completedAt: new Date('2024-01-15T11:00:00'),
      invoiceNumber: 'INV-001',
      invoiceDate: new Date('2024-01-15'),
      swishUUID: 'swish-123',
      createdAt: new Date('2024-01-10'),
      lessonTypeName: 'B-körkort',
    },
    {
      id: 'booking-2',
      scheduledDate: '2024-01-22',
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60,
      status: 'cancelled',
      paymentStatus: 'refunded',
      paymentMethod: 'swish',
      totalPrice: '500.00',
      notes: 'Avbokad pga sjukdom',
      isCompleted: false,
      completedAt: null,
      invoiceNumber: 'INV-002',
      invoiceDate: new Date('2024-01-20'),
      swishUUID: 'swish-456',
      createdAt: new Date('2024-01-18'),
      lessonTypeName: 'B-körkort',
    }
  ],
  teacherBookings: [
    { id: 'teacher-booking-1' },
    { id: 'teacher-booking-2' }
  ],
  deletedBy: {
    firstName: 'Admin',
    lastName: 'Användare',
    email: 'admin@trafikskolax.se',
  },
  deletedAt: new Date()
};

async function testPDFGeneration() {
  try {
    console.log('🧪 Testing PDF generation...');
    
    // Test filename generation
    const fileName = generatePDFFileName(testData.user.id, `${testData.user.firstName} ${testData.user.lastName}`);
    console.log('✅ Generated filename:', fileName);
    
    // Test PDF generation
    console.log('📄 Generating PDF...');
    const pdfBuffer = await generateUserDeletionPDF(testData);
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    // Test PDF storage
    console.log('💾 Saving PDF to storage...');
    const filePath = await savePDFToStorage(pdfBuffer, fileName);
    console.log('✅ PDF saved successfully to:', filePath);
    
    console.log('\n🎉 All tests passed! PDF generation is working correctly.');
    console.log(`📁 PDF saved at: ${filePath}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPDFGeneration();
