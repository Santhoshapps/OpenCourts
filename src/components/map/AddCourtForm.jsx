
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, MapPin } from "lucide-react";

const amenitiesList = ["Parking", "Restrooms", "Lights", "Water Fountain", "Backboard", "Pro Shop", "Cafe"];

export default function AddCourtForm({ location, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    address: location.formatted_address || "",
    sport: "tennis", // Added sport field
    total_courts: 2,
    court_type: "hard",
    is_public: true,
    amenities: [],
    operating_hours_info: "", // Added operating hours
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (amenity, checked) => {
    setFormData((prev) => {
      const newAmenities = checked
        ? [...prev.amenities, amenity]
        : prev.amenities.filter((a) => a !== amenity);
      return { ...prev, amenities: newAmenities };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Add New Tennis Court
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Court or Park Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Riverside Tennis Courts"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter the address"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* New Sport selection */}
              <div className="space-y-2">
                <Label htmlFor="sport">Sport</Label>
                <Select value={formData.sport} onValueChange={value => handleSelectChange('sport', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tennis">Tennis</SelectItem>
                    <SelectItem value="pickleball">Pickleball</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Existing Number of Courts, now as second item in grid */}
              <div className="space-y-2">
                <Label htmlFor="total_courts">Number of Courts</Label>
                <Input
                  id="total_courts"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.total_courts}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_courts: parseInt(e.target.value, 10) }))}
                  required
                />
              </div>
              {/* Existing Court Surface, now wraps to next row if content overflows */}
              <div className="space-y-2">
                <Label htmlFor="court_type">Court Surface</Label>
                <Select value={formData.court_type} onValueChange={value => handleSelectChange('court_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hard">Hard Court</SelectItem>
                    <SelectItem value="clay">Clay Court</SelectItem>
                    <SelectItem value="grass">Grass Court</SelectItem>
                    <SelectItem value="indoor">Indoor</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="operating_hours_info">Operating Hours</Label>
                <Input
                  id="operating_hours_info"
                  value={formData.operating_hours_info}
                  onChange={(e) => setFormData(prev => ({...prev, operating_hours_info: e.target.value}))}
                  placeholder="e.g., 8am-10pm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
              />
              <Label htmlFor="is_public">Public court (free to use)</Label>
            </div>

            <div className="space-y-3">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2">
                {amenitiesList.map(amenity => (
                  <div key={amenity} className="flex items-center gap-2">
                    <Checkbox
                      id={amenity}
                      onCheckedChange={checked => handleCheckboxChange(amenity, checked)}
                      checked={formData.amenities.includes(amenity)}
                    />
                    <Label htmlFor={amenity} className="text-sm font-normal">{amenity}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                Add Court
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
