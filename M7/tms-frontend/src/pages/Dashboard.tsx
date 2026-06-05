
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useOrdersQuery } from '@/http/orders.queries';
import { useKPIsQuery, useKPIWidgetsQuery } from '@/http/kpis.queries';
import { RoutePerformanceCard } from './dashboard/RoutePerformanceCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: orders = [], isLoading: ordersLoading } = useOrdersQuery();
  const { data: kpis, isLoading: kpisLoading } = useKPIsQuery();
  const { data: kpiWidgets = [], isLoading: kpiWidgetsLoading } = useKPIWidgetsQuery();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'returned': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const quickActions = [
    { icon: '➕', title: 'New Order', onClick: () => navigate('/orders/new') },
    { icon: '🗺️', title: 'Track Fleet', onClick: () => navigate('/vehicles/fleet') },
    { icon: '📄', title: 'View Invoices', onClick: () => navigate('/payments') },
    { icon: '⚠️', title: 'Report Incident', onClick: () => navigate('/incidents/new') },
  ];

  if (ordersLoading || kpisLoading || kpiWidgetsLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiWidgets.map((kpi, index) => (
          <MetricCard
            key={index}
            title={kpi.title}
            value={kpi.value}
            description={kpi.description}
            trend={kpi.trend}
            bgColor={kpi.bgColor}
            valueColor={kpi.color}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Card key={index} className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={action.onClick}>
            <div className="text-3xl mb-2">{action.icon}</div>
            <h3 className="font-medium">{action.title}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest transportation orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{order.customer}</p>
                    <p className="text-sm text-gray-500">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <p className="text-sm font-medium mt-1">{order.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Route Performance */}
        <RoutePerformanceCard />
      </div>
    </div>
  );
};

export default Dashboard;
