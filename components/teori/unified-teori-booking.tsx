'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  UserCheck,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Info,
  CheckCircle,
  User,
  Mail,
  Phone,
  CreditCard
} from 'lucide-react';

// React Bits Stepper Component
interface StepperProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  currentStep: number;
  className?: string;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className = '' }) => {
  return (
    <div className={`flex items-center justify-between w-full max-w-4xl mx-auto mb-8 ${className}`}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index < currentStep ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            <div className="mt-2 text-center">
              <p className={`text-sm font-medium ${
                index <= currentStep ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              )}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-4 transition-all duration-200 ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

interface TeoriLessonType {
  id: string;
  name: string;
  description: string | null;
  allowsSupervisors: boolean;
  price: string;
  pricePerSupervisor: string | null;
  durationMinutes: number;
  maxParticipants: number;
  isActive: boolean;
  sessions?: TeoriSession[];
}

interface TeoriSession {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  allowsSupervisors: boolean;
  pricePerSupervisor?: number;
  availableSpots: number;
  formattedDateTime: string;
}

interface SupervisorInfo {
  name: string;
  email: string;
  phone: string;
  personalNumber?: string;
}

interface BookingData {
  selectedType: TeoriLessonType | null;
  selectedSession: TeoriSession | null;
  supervisors: SupervisorInfo[];
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

const steps = [
  { id: 'type', title: 'Välj Typ', description: 'Teorilektionstyp' },
  { id: 'session', title: 'Välj Session', description: 'Datum & tid' },
  { id: 'details', title: 'Detaljer', description: 'Handledare & info' },
  { id: 'payment', title: 'Betalning', description: 'Slutför bokning' }
];

export function UnifiedTeoriBooking() {
  const [currentStep, setCurrentStep] = useState(0);
  const [lessonTypes, setLessonTypes] = useState<TeoriLessonType[]>([]);
  const [sessions, setSessions] = useState<TeoriSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingData>({
    selectedType: null,
    selectedSession: null,
    supervisors: [],
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    }
  });

  useEffect(() => {
    loadLessonTypes();
  }, []);

  const loadLessonTypes = async () => {
    try {
      const response = await fetch('/api/teori/unified-booking-data');
      if (!response.ok) {
        throw new Error('Failed to fetch lesson types');
      }
      const data = await response.json();
      if (data.success) {
        setLessonTypes(data.lessonTypes || []);
      } else {
        throw new Error(data.error || 'Failed to load data');
      }
    } catch (error) {
      console.error('Error loading lesson types:', error);
      toast.error('Kunde inte ladda teorilektionstyper');
      // Fallback to demo data
      const demoData: TeoriLessonType[] = [
        {
          id: '1',
          name: 'Grundkurs Teori',
          description: 'Grundläggande teorilektion för studenter',
          allowsSupervisors: false,
          price: '500.00',
          pricePerSupervisor: null,
          durationMinutes: 60,
          maxParticipants: 1,
          isActive: true
        },
        {
          id: '2',
          name: 'Handledar Teori',
          description: 'Teorilektion med handledare - tidigare Handledarutbildning',
          allowsSupervisors: true,
          price: '700.00',
          pricePerSupervisor: '500.00',
          durationMinutes: 120,
          maxParticipants: 1,
          isActive: true
        }
      ];
      setLessonTypes(demoData);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async (typeId: string) => {
    try {
      setLoading(true);
      // Use sessions from the selected lesson type
      const selectedType = lessonTypes.find(type => type.id === typeId);
      if (selectedType && selectedType.sessions) {
        setSessions(selectedType.sessions);
      } else {
        setSessions([]);
        toast.error('Inga sessioner tillgängliga för denna lektionstyp');
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Kunde inte ladda sessioner');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type: TeoriLessonType) => {
    setBookingData(prev => ({ ...prev, selectedType: type }));
    loadSessions(type.id);
    setCurrentStep(1);
  };

  const handleSessionSelect = (session: TeoriSession) => {
    setBookingData(prev => ({ ...prev, selectedSession: session }));
    setCurrentStep(2);
  };

  const addSupervisor = () => {
    setBookingData(prev => ({
      ...prev,
      supervisors: [...prev.supervisors, { name: '', email: '', phone: '' }]
    }));
  };

  const updateSupervisor = (index: number, field: keyof SupervisorInfo, value: string) => {
    setBookingData(prev => ({
      ...prev,
      supervisors: prev.supervisors.map((sup, i) => 
        i === index ? { ...sup, [field]: value } : sup
      )
    }));
  };

  const removeSupervisor = (index: number) => {
    setBookingData(prev => ({
      ...prev,
      supervisors: prev.supervisors.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateTotalPrice = () => {
    const basePrice = bookingData.selectedSession?.price || 0;
    const supervisorPrice = (bookingData.selectedSession?.pricePerSupervisor || 0) * bookingData.supervisors.length;
    return basePrice + supervisorPrice;
  };

  const handlePayment = async () => {
    try {
      toast.success('Bokning genomförd! (Demo)');
      // Implement actual payment logic here
    } catch (error) {
      toast.error('Fel vid betalning');
    }
  };

  if (loading && currentStep === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar teorilektioner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            🎓 Boka Teorilektion
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Enkel och smidig bokning av teorilektioner med eller utan handledare
          </p>
        </div>

        {/* Stepper */}
        <Stepper steps={steps} currentStep={currentStep} />

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Select Type */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Välj Teorilektionstyp</h2>
                <p className="text-gray-600">Välj den typ av teorilektion som passar dina behov</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lessonTypes.map((type) => (
                  <Card
                    key={type.id}
                    className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 hover:border-blue-300 bg-white"
                    onClick={() => handleTypeSelect(type)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{type.name}</span>
                        {type.allowsSupervisors ? (
                          <Badge variant="outline" className="border-green-300 text-green-700">
                            Med Handledare
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-blue-300 text-blue-700">
                            Student Endast
                          </Badge>
                        )}
                      </CardTitle>
                      {type.description && (
                        <p className="text-gray-600">{type.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="font-semibold">{type.price} SEK</p>
                            <p className="text-xs text-gray-500">Grundpris</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-semibold">{type.durationMinutes} min</p>
                            <p className="text-xs text-gray-500">Längd</p>
                          </div>
                        </div>
                      </div>
                      {type.allowsSupervisors && type.pricePerSupervisor && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              +{type.pricePerSupervisor} SEK per handledare
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Session */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Välj Session</h2>
                <p className="text-gray-600">Välj datum och tid för din {bookingData.selectedType?.name}</p>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Laddar tillgängliga sessioner...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {sessions.map((session) => (
                    <Card
                      key={session.id}
                      className="cursor-pointer transition-all hover:shadow-lg hover:border-blue-300"
                      onClick={() => handleSessionSelect(session)}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">{session.title}</h3>
                            <p className="text-gray-600 mb-4">{session.formattedDateTime}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{session.availableSpots} platser kvar</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{bookingData.selectedType?.durationMinutes} min</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {session.price} kr
                            </div>
                            {session.allowsSupervisors && session.pricePerSupervisor && (
                              <div className="text-sm text-gray-500">
                                +{session.pricePerSupervisor} kr/handledare
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <Button onClick={handleBack} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tillbaka
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Bokningsdetaljer</h2>
                <p className="text-gray-600">Fyll i dina uppgifter och lägg till handledare om det behövs</p>
              </div>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Dina uppgifter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Förnamn</Label>
                      <Input
                        id="firstName"
                        value={bookingData.customerInfo.firstName}
                        onChange={(e) => setBookingData(prev => ({
                          ...prev,
                          customerInfo: { ...prev.customerInfo, firstName: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Efternamn</Label>
                      <Input
                        id="lastName"
                        value={bookingData.customerInfo.lastName}
                        onChange={(e) => setBookingData(prev => ({
                          ...prev,
                          customerInfo: { ...prev.customerInfo, lastName: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">E-post</Label>
                    <Input
                      id="email"
                      type="email"
                      value={bookingData.customerInfo.email}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        customerInfo: { ...prev.customerInfo, email: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={bookingData.customerInfo.phone}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        customerInfo: { ...prev.customerInfo, phone: e.target.value }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Supervisors */}
              {bookingData.selectedSession?.allowsSupervisors && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Handledare
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {bookingData.supervisors.map((supervisor, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Handledare {index + 1}</h4>
                          <Button
                            onClick={() => removeSupervisor(index)}
                            variant="outline"
                            size="sm"
                          >
                            Ta bort
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            placeholder="Namn"
                            value={supervisor.name}
                            onChange={(e) => updateSupervisor(index, 'name', e.target.value)}
                          />
                          <Input
                            placeholder="E-post"
                            type="email"
                            value={supervisor.email}
                            onChange={(e) => updateSupervisor(index, 'email', e.target.value)}
                          />
                          <Input
                            placeholder="Telefon"
                            value={supervisor.phone}
                            onChange={(e) => updateSupervisor(index, 'phone', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                    <Button onClick={addSupervisor} variant="outline" className="w-full">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Lägg till handledare
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button onClick={handleBack} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tillbaka
                </Button>
                <Button onClick={handleNext}>
                  Fortsätt till betalning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Bekräfta & Betala</h2>
                <p className="text-gray-600">Granska din bokning och slutför betalningen</p>
              </div>

              {/* Booking Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Bokningssammanfattning</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Teorilektion:</span>
                    <span className="font-medium">{bookingData.selectedType?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Datum & tid:</span>
                    <span className="font-medium">{bookingData.selectedSession?.formattedDateTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grundpris:</span>
                    <span className="font-medium">{bookingData.selectedSession?.price} kr</span>
                  </div>
                  {bookingData.supervisors.length > 0 && (
                    <div className="flex justify-between">
                      <span>Handledare ({bookingData.supervisors.length} st):</span>
                      <span className="font-medium">
                        {(bookingData.selectedSession?.pricePerSupervisor || 0) * bookingData.supervisors.length} kr
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Totalt:</span>
                      <span>{calculateTotalPrice()} kr</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button onClick={handleBack} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tillbaka
                </Button>
                <Button onClick={handlePayment} className="bg-green-600 hover:bg-green-700">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Betala {calculateTotalPrice()} kr
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
