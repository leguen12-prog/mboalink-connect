import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import PhotoUpload from './PhotoUpload';
import SignatureCapture from './SignatureCapture';
import AutomatedCommunications from './AutomatedCommunications';
import StatusBadge from '../ui/StatusBadge';
import { toast } from 'sonner';

export default function JobDetailsDialog({ job, open, onOpenChange, isOnline, onUpdate }) {
  const [technicianNotes, setTechnicianNotes] = useState(job.technician_notes || '');
  const [completionNotes, setCompletionNotes] = useState(job.completion_notes || '');
  const [photos, setPhotos] = useState(job.photos || []);
  const [signature, setSignature] = useState(job.customer_signature || '');
  const [equipmentUsed, setEquipmentUsed] = useState(job.equipment_used || []);

  const handleComplete = async () => {
    if (!signature) {
      toast.error('Customer signature is required');
      return;
    }

    if (photos.length === 0) {
      toast.error('At least one photo is required');
      return;
    }

    await onUpdate({
      status: 'completed',
      actual_end_time: new Date().toISOString(),
      technician_notes: technicianNotes,
      completion_notes: completionNotes,
      photos: photos,
      customer_signature: signature,
      equipment_used: equipmentUsed
    });

    toast.success('Job completed successfully');
    onOpenChange(false);
  };

  const handleSaveProgress = async () => {
    await onUpdate({
      technician_notes: technicianNotes,
      photos: photos,
      equipment_used: equipmentUsed
    });

    toast.success('Progress saved');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{job.work_order_id}</DialogTitle>
              <p className="text-slate-400 capitalize mt-1">{job.type}</p>
            </div>
            <StatusBadge status={job.status} />
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="signature">Signature</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="comms">
              <MessageSquare className="w-4 h-4 mr-2" />
              Comms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="bg-slate-800/30 rounded-lg p-4 space-y-3">
              <div>
                <label className="text-sm text-slate-400">Customer</label>
                <p className="text-white">{job.customer_id}</p>
              </div>

              {job.scheduled_date && (
                <div>
                  <label className="text-sm text-slate-400">Scheduled</label>
                  <p className="text-white">
                    {new Date(job.scheduled_date).toLocaleDateString()}
                    {job.scheduled_time_slot && ` - ${job.scheduled_time_slot}`}
                  </p>
                </div>
              )}

              {job.location && (
                <div>
                  <label className="text-sm text-slate-400">Location</label>
                  <p className="text-white">
                    {job.location.address}
                    {job.location.city && `, ${job.location.city}`}
                  </p>
                </div>
              )}

              {job.estimated_duration_minutes && (
                <div>
                  <label className="text-sm text-slate-400">Estimated Duration</label>
                  <p className="text-white">{job.estimated_duration_minutes} minutes</p>
                </div>
              )}
            </div>

            {job.equipment_needed && job.equipment_needed.length > 0 && (
              <div className="bg-slate-800/30 rounded-lg p-4">
                <label className="text-sm text-slate-400 mb-2 block">Equipment Needed</label>
                <ul className="list-disc list-inside space-y-1 text-white">
                  {job.equipment_needed.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {!isOnline && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Offline mode - changes will sync when online</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            <PhotoUpload
              photos={photos}
              onPhotosChange={setPhotos}
              isOnline={isOnline}
            />
          </TabsContent>

          <TabsContent value="signature" className="mt-4">
            <SignatureCapture
              signature={signature}
              onSignatureChange={setSignature}
            />
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Technician Notes</label>
              <Textarea
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                placeholder="Add your observations, issues encountered, or any relevant information..."
                className="bg-slate-800/50 border-slate-700 text-white min-h-[120px]"
              />
            </div>

            {job.status === 'in_progress' && (
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Completion Notes</label>
                <Textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Summary of work completed, parts used, customer feedback..."
                  className="bg-slate-800/50 border-slate-700 text-white min-h-[120px]"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="comms" className="mt-4">
            <AutomatedCommunications 
              job={job}
              technicianName="Field Technician"
            />
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t border-slate-800">
          {job.status === 'in_progress' && (
            <>
              <Button
                onClick={handleSaveProgress}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                Save Progress
              </Button>
              <Button
                onClick={handleComplete}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Job
              </Button>
            </>
          )}
          {job.status !== 'in_progress' && (
            <Button
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}