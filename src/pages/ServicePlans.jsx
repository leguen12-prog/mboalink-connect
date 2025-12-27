import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, Wifi, Zap, Check, Edit, Trash2,
  MoreVertical, ArrowUp, ArrowDown, Star
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from '@/components/ui/PageHeader';
import { Badge } from "@/components/ui/badge";

export default function ServicePlans() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    plan_code: '',
    name: '',
    description: '',
    category: 'residential',
    download_speed_mbps: 50,
    upload_speed_mbps: 25,
    data_cap_gb: null,
    price_monthly: 15000,
    price_daily: null,
    price_weekly: null,
    setup_fee: 25000,
    priority_class: 'best_effort',
    features: [],
    static_ip_available: false,
    is_active: true
  });
  const [newFeature, setNewFeature] = useState('');

  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['servicePlans'],
    queryFn: () => base44.entities.ServicePlan.list('display_order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ServicePlan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['servicePlans']);
      setShowAddDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServicePlan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['servicePlans']);
      setShowAddDialog(false);
      setSelectedPlan(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ServicePlan.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['servicePlans'])
  });

  const resetForm = () => {
    setFormData({
      plan_code: '',
      name: '',
      description: '',
      category: 'residential',
      download_speed_mbps: 50,
      upload_speed_mbps: 25,
      data_cap_gb: null,
      price_monthly: 15000,
      price_daily: null,
      price_weekly: null,
      setup_fee: 25000,
      priority_class: 'best_effort',
      features: [],
      static_ip_available: false,
      is_active: true
    });
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData({...formData, features: [...(formData.features || []), newFeature.trim()]});
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData({...formData, features: formData.features.filter((_, i) => i !== index)});
  };

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setFormData(plan);
    setShowAddDialog(true);
  };

  const groupedPlans = {
    residential: plans.filter(p => p.category === 'residential'),
    business: plans.filter(p => p.category === 'business'),
    enterprise: plans.filter(p => p.category === 'enterprise'),
    payg: plans.filter(p => p.category === 'payg')
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'residential': return 'from-blue-500/20 to-blue-600/10 border-blue-500/30';
      case 'business': return 'from-purple-500/20 to-purple-600/10 border-purple-500/30';
      case 'enterprise': return 'from-amber-500/20 to-amber-600/10 border-amber-500/30';
      case 'payg': return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30';
      default: return 'from-slate-500/20 to-slate-600/10 border-slate-500/30';
    }
  };

  const PlanCard = ({ plan, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative rounded-2xl bg-gradient-to-br ${getCategoryColor(plan.category)} border p-6`}
    >
      {!plan.is_active && (
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="bg-slate-800/80 text-slate-400 border-slate-600">
            Inactive
          </Badge>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          <p className="text-sm text-slate-400 mt-1">{plan.plan_code}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
            <DropdownMenuItem onClick={() => handleEdit(plan)}>
              <Edit className="w-4 h-4 mr-2" /> Edit Plan
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => deleteMutation.mutate(plan.id)}
              className="text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold text-white">
            {(plan.price_monthly || 0).toLocaleString()}
          </span>
          <span className="text-slate-400 mb-1">XAF/mo</span>
        </div>
        {plan.setup_fee > 0 && (
          <p className="text-sm text-slate-500 mt-1">
            + {plan.setup_fee?.toLocaleString()} XAF setup
          </p>
        )}
      </div>

      <div className="flex items-center gap-6 mb-6 p-4 rounded-xl bg-slate-900/30">
        <div className="flex items-center gap-2">
          <ArrowDown className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-2xl font-bold text-white">{plan.download_speed_mbps}</p>
            <p className="text-xs text-slate-500">Mbps Down</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUp className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-2xl font-bold text-white">{plan.upload_speed_mbps}</p>
            <p className="text-xs text-slate-500">Mbps Up</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-lg font-bold text-white">
              {plan.data_cap_gb ? `${plan.data_cap_gb} GB` : '∞'}
            </p>
            <p className="text-xs text-slate-500">Data Cap</p>
          </div>
        </div>
      </div>

      {plan.features && plan.features.length > 0 && (
        <div className="space-y-2">
          {plan.features.slice(0, 4).map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">{feature}</span>
            </div>
          ))}
          {plan.features.length > 4 && (
            <p className="text-sm text-slate-500">+ {plan.features.length - 4} more features</p>
          )}
        </div>
      )}

      {plan.static_ip_available && (
        <div className="mt-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-400">Static IP Available</span>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Service Plans" 
        subtitle={`${plans.length} active plans`}
        action={() => setShowAddDialog(true)}
        actionLabel="Add Plan"
        actionIcon={Plus}
      />

      {/* Residential Plans */}
      {groupedPlans.residential.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            Residential Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedPlans.residential.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Business Plans */}
      {groupedPlans.business.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            Business Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedPlans.business.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Enterprise Plans */}
      {groupedPlans.enterprise.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            Enterprise Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedPlans.enterprise.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* PAYG Plans */}
      {groupedPlans.payg.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            Pay As You Go Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedPlans.payg.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {plans.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Wifi className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">No Service Plans</h3>
          <p className="text-slate-400 mb-6">Create your first service plan to get started</p>
          <Button onClick={() => setShowAddDialog(true)} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
            <Plus className="w-4 h-4 mr-2" /> Create Plan
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedPlan ? 'Edit Service Plan' : 'Create Service Plan'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Plan Code *</Label>
              <Input 
                value={formData.plan_code}
                onChange={(e) => setFormData({...formData, plan_code: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
                placeholder="e.g., RES-50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Plan Name *</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
                placeholder="e.g., Fibre 50"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-slate-400">Description</Label>
              <Input 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Category *</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="payg">Pay As You Go</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Priority Class</Label>
              <Select value={formData.priority_class} onValueChange={(val) => setFormData({...formData, priority_class: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="best_effort">Best Effort</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Download Speed (Mbps) *</Label>
              <Input 
                type="number"
                value={formData.download_speed_mbps}
                onChange={(e) => setFormData({...formData, download_speed_mbps: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Upload Speed (Mbps) *</Label>
              <Input 
                type="number"
                value={formData.upload_speed_mbps}
                onChange={(e) => setFormData({...formData, upload_speed_mbps: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Monthly Price (XAF) *</Label>
              <Input 
                type="number"
                value={formData.price_monthly}
                onChange={(e) => setFormData({...formData, price_monthly: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Setup Fee (XAF)</Label>
              <Input 
                type="number"
                value={formData.setup_fee}
                onChange={(e) => setFormData({...formData, setup_fee: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Data Cap (GB)</Label>
              <Input 
                type="number"
                value={formData.data_cap_gb || ''}
                onChange={(e) => setFormData({...formData, data_cap_gb: e.target.value ? parseInt(e.target.value) : null})}
                className="bg-slate-800/50 border-slate-700 text-white"
                placeholder="Leave empty for unlimited"
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30">
              <Label className="text-slate-400">Static IP Available</Label>
              <Switch 
                checked={formData.static_ip_available}
                onCheckedChange={(checked) => setFormData({...formData, static_ip_available: checked})}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-slate-400">Features</Label>
              <div className="flex gap-2">
                <Input 
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  placeholder="Add a feature..."
                />
                <Button onClick={handleAddFeature} variant="outline" className="border-slate-700">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.features?.map((feature, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="bg-slate-800 text-slate-300 cursor-pointer"
                    onClick={() => handleRemoveFeature(i)}
                  >
                    {feature} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 sm:col-span-2">
              <Label className="text-slate-400">Active</Label>
              <Switch 
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setSelectedPlan(null); resetForm(); }} className="border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedPlan) {
                  updateMutation.mutate({ id: selectedPlan.id, data: formData });
                } else {
                  createMutation.mutate(formData);
                }
              }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900"
              disabled={!formData.plan_code || !formData.name}
            >
              {selectedPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}