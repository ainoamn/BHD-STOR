"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RouteMap } from "@/components/logistics/RouteMap";
import {
  ArrowLeft,
  Radio,
  Phone,
  MessageSquare,
  Navigation,
  Clock,
  Gauge,
  MapPin,
  CheckCircle,
  Circle,
  Send,
  Truck,
  User,
} from "lucide-react";

const driverInfo = {
  id: "d1",
  name: "Khalid Bin Said",
  phone: "+968 9555 1234",
  vehicle: "Toyota Hilux (OM-1234)",
  rating: 4.8,
};

const routeStops = [
  {
    id: 1,
    address: "Building 47, Way 2901, Al Khuwair, Muscat",
    type: "pickup" as const,
    status: "completed" as const,
    shipmentId: "TRK-2847",
    receiver: "Oman Electronics LLC",
    time: "09:15 AM",
  },
  {
    id: 2,
    address: "Villa 12, Al Shatti, Qurum, Muscat",
    type: "delivery" as const,
    status: "completed" as const,
    shipmentId: "TRK-2847",
    receiver: "Ahmed Al-Farsi",
    time: "10:30 AM",
  },
  {
    id: 3,
    address: "Office 301, Al Harthy Complex, Ruwi",
    type: "pickup" as const,
    status: "completed" as const,
    shipmentId: "TRK-2862",
    receiver: "Oman Pharma Ltd",
    time: "11:00 AM",
  },
  {
    id: 4,
    address: "Flat 55, Madinat Al Sultan Qaboos",
    type: "delivery" as const,
    status: "in_progress" as const,
    shipmentId: "TRK-2862",
    receiver: "Dr. Fatima Al-Said",
    time: "12:15 PM",
  },
  {
    id: 5,
    address: "Shop 8, Muttrah Souk Area",
    type: "pickup" as const,
    status: "pending" as const,
    shipmentId: "TRK-2863",
    receiver: "Al Fair Trading",
    time: "01:30 PM",
  },
  {
    id: 6,
    address: "House 22, Bawshar Heights",
    type: "delivery" as const,
    status: "pending" as const,
    shipmentId: "TRK-2860",
    receiver: "Nasser Al-Harthy",
    time: "02:45 PM",
  },
];

export default function DriverLiveTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState({
    lat: 23.6105,
    lng: 58.445,
  });
  const [speed, setSpeed] = useState(42);
  const [eta, setEta] = useState("12:15 PM");
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "dispatcher",
      text: "How is the route going?",
      time: "11:30 AM",
    },
    {
      id: 2,
      sender: "driver",
      text: "Going well. Just delivered to Qurum. On my way to Madinat Al Sultan Qaboos.",
      time: "11:35 AM",
    },
  ]);

  // Simulate live position updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLocation((prev) => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.0002,
        lng: prev.lng + (Math.random() - 0.5) * 0.0002,
      }));
      setSpeed(Math.floor(35 + Math.random() * 30));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const completedStops = routeStops.filter(
    (s) => s.status === "completed"
  ).length;
  const progress = (completedStops / routeStops.length) * 100;

  const handleSendMessage = () => {
    if (!message.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        sender: "dispatcher",
        text: message,
        time: new Date().toLocaleTimeString("en-OM", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setMessage("");
  };

  const currentStop = routeStops.find((s) => s.status === "in_progress");

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">{driverInfo.name}</h1>
                <Badge
                  variant="default"
                  className="text-[10px] gap-1 bg-emerald-500"
                >
                  <Radio className="h-2.5 w-2.5 animate-pulse" />
                  Online
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {driverInfo.vehicle} · Rating {driverInfo.rating}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
          <Button variant="outline" size="sm" onClick={() => setChatOpen(!chatOpen)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 flex items-center gap-3">
            <Gauge className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Speed</p>
              <p className="text-lg font-bold">{speed} km/h</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Est. Arrival</p>
              <p className="text-lg font-bold">{eta}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Navigation className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Distance Left</p>
              <p className="text-lg font-bold">4.2 km</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-bold">
                {completedStops}/{routeStops.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Map */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="p-0 flex-1">
            <RouteMap
              className="h-full rounded-lg"
              driverLocation={currentLocation}
              stops={routeStops.map((s) => ({
                lat: 23.588 + Math.random() * 0.05,
                lng: 58.3829 + Math.random() * 0.05,
                label: s.type === "pickup" ? "P" : "D",
                completed: s.status === "completed",
              }))}
            />
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="w-[350px] shrink-0 space-y-4 overflow-y-auto">
          {/* Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Route Progress</span>
                <span className="text-xs text-muted-foreground">
                  {completedStops}/{routeStops.length} stops
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          {/* Current Stop */}
          {currentStop && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  Current Stop
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm font-medium">
                    {currentStop.address}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Shipment</p>
                    <p className="text-xs font-mono">
                      {currentStop.shipmentId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Receiver</p>
                    <p className="text-xs">{currentStop.receiver}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Est. {currentStop.time}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Stops List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Today&apos;s Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {routeStops.map((stop, index) => (
                <div
                  key={stop.id}
                  className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
                    stop.status === "in_progress"
                      ? "bg-primary/10 border border-primary/30"
                      : stop.status === "completed"
                        ? "bg-muted/50"
                        : "bg-card border"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    {stop.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : stop.status === "in_progress" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    {index < routeStops.length - 1 && (
                      <div
                        className={`w-0.5 h-6 ${
                          stop.status === "completed"
                            ? "bg-emerald-500"
                            : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 h-4"
                      >
                        {stop.type}
                      </Badge>
                      <span className="text-xs font-mono">
                        {stop.shipmentId}
                      </span>
                    </div>
                    <p className="text-xs font-medium mt-0.5 truncate">
                      {stop.receiver}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {stop.address}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {stop.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chat Panel */}
        {chatOpen && (
          <Card className="w-[300px] shrink-0 flex flex-col">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat with {driverInfo.name.split(" ")[0]}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "dispatcher"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-2.5 rounded-lg text-xs ${
                      msg.sender === "dispatcher"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p
                      className={`text-[9px] mt-1 ${
                        msg.sender === "dispatcher"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="text-xs h-9"
                />
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={handleSendMessage}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
