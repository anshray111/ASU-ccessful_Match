
import React, { useState, useEffect } from 'react';
import { Session } from '../types/models';
import { createMeeting } from '../services/meetingService';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const { currentUser } = useAuth();
  const [isCreatingMeeting, setIsCreatingMeeting] = useState<boolean>(false);
  const navigate = useNavigate();

  // ✅ Fetch all sessions on load
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('http://localhost:3007/api/sessions/all');
        const data = await response.json();

        const sessions = data.sessions.map((s: any) => ({
          id: s.id,
          tutorId: s.tutor_id,
          studentId: s.student_id,
          subject: s.subject,
          startTime: new Date(s.start_time),
          endTime: new Date(s.end_time),
          status: s.status,
          zoomLink: s.zoomLink,
          sessionType: s.sessionType,
          title: s.title,
          description: s.description
        }));

        setSessions(sessions);
        console.log("Fetched sessions:", sessions);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        
        // Fallback to sample data if API fails
        if (window.location.hostname === 'localhost') {
          console.log("Using sample data");
          const mockSessions = [
            {
              id: "session-1",
              tutorId: "user-1",
              studentId: currentUser?.id || "user-2",
              subject: { id: "subject-1", code: "CSE101", name: "Intro to Programming" },
              startTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
              endTime: new Date(Date.now() + 1000 * 60 * 60 * 25), // tomorrow + 1 hour
              status: 'scheduled' as const,
              sessionType: 'tutor' as const,
              title: "Programming Fundamentals",
              description: "Going over the basics of programming"
            },
            {
              id: "session-2",
              tutorId: "user-3",
              studentId: currentUser?.id || "user-2",
              subject: { id: "subject-2", code: "PHY101", name: "Physics Lab Review" },
              startTime: new Date("2025-04-08T11:30:00Z"),
              endTime: new Date("2025-04-08T12:15:00Z"),
              status: 'scheduled' as const,
              sessionType: 'tutor' as const,
              title: "Physics Lab Review",
              description: "Preparing for upcoming lab experiments"
            },
          ];
          setSessions(mockSessions);
        } else {
          toast.error('Could not fetch sessions.');
        }
      }
    };

    fetchSessions();
  }, [currentUser]);

  // ✅ Join or create Zoom link for a session
  const handleJoinSession = async (session: Session) => {
    try {
      setIsCreatingMeeting(true);
      
      if (!session.zoomLink) {
        const meetingData = {
          topic: session.title || session.subject.name,
          start_time: new Date(session.startTime).toISOString(),
          duration: Math.ceil((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (60 * 1000)),
          subject: session.subject,
          title: session.title,
          session_type: session.sessionType,
          description: session.description,
          zoomLink: session.zoomLink
        };

        const createdMeeting = await createMeeting(meetingData);
        console.log("Created meeting:", createdMeeting);

        if (createdMeeting) {
          const updatedSession = {
            ...session,
            zoomLink: createdMeeting.join_url
          };

          setSessions(prev => prev.map(s =>
            s.id === session.id ? updatedSession : s
          ));

          toast.success("Session created successfully!");
          
          // Navigate to calendar view to see the created session
          navigate("/calendar");
        }
      } else {
        window.open(session.zoomLink, '_blank');
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
      toast.error('Could not create meeting. Please try again.');
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  return (
    <Layout requireAuth>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">My Sessions</h1>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p>You don't have any upcoming sessions.</p>
            ) : (
              <div className="space-y-4">
                {sessions.map(session => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{session.title || session.subject.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {session.sessionType === 'tutor' ? 'Tutoring Session' : 'Peer Study Group'}
                        </p>
                        <div className="flex items-center mt-2">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(session.startTime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <Clock className="w-4 h-4 ml-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(session.startTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })} - 
                            {new Date(session.endTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleJoinSession(session)} 
                        size="sm"
                        disabled={isCreatingMeeting}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        {session.zoomLink ? 'Join Session' : 'Create Meeting'}
                      </Button>
                    </div>

                    {session.description && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <p className="text-sm">{session.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Sessions;
