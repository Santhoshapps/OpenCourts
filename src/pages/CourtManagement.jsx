import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, PlusCircle, ArrowRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import SyncCourts from "../components/courts/SyncCourts";

export default function CourtManagement() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Court Tools</h1>
          <p className="text-gray-600 mt-1">
            Manage your local court database. Find, add, and sync courts to keep information up-to-date for everyone.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-6 h-6 text-emerald-600" />
                Court Discovery Map
              </CardTitle>
              <CardDescription>
                Explore an interactive map to find existing courts or pinpoint a location to add a new one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={createPageUrl("MapSearch")}>
                <Button className="w-full">
                  Open Discovery Map <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-emerald-600" />
                Add a Court Manually
              </CardTitle>
              <CardDescription>
                Know of a court that's missing? Add its details using our guided form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={createPageUrl("AddCourt")}>
                <Button className="w-full">
                  Add a New Court <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
            <SyncCourts />
        </div>
      </div>
    </div>
  );
}