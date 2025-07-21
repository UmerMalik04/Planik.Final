import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Camera, Plus, Trash2 } from 'lucide-react';
import { useDietStore, FoodItem } from '@/stores/useDietStore';

export default function DietTracker() {
  const navigate = useNavigate();
  const { dailyNutrition, addFood, removeFood, getDailyNutrition, scanFood } = useDietStore();
  const [isScanning, setIsScanning] = useState(false);
  const [showAddFood, setShowAddFood] = useState(false);
  const [scannedFood, setScannedFood] = useState<FoodItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentDate = new Date().toISOString().split('T')[0];
  const todayNutrition = getDailyNutrition(currentDate);
  
  const [newFood, setNewFood] = useState({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    quantity: 1,
    unit: 'serving'
  });

  const handleScanFood = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      // Convert file to base64 for API call
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        const scannedResult = await scanFood(imageData);
        
        if (scannedResult) {
          setScannedFood(scannedResult);
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Scanning failed:', error);
      setIsScanning(false);
    }
  };

  const handleAddFood = () => {
    addFood({
      ...newFood,
      date: currentDate
    });
    
    setNewFood({
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      quantity: 1,
      unit: 'serving'
    });
    setShowAddFood(false);
  };

  const handleAddScannedFood = () => {
    if (scannedFood) {
      addFood({
        ...scannedFood,
        date: currentDate
      });
      setScannedFood(null);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-gray-700 hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diet Tracker</h1>
          <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Daily Summary */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Today's Nutrition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{todayNutrition.totalCalories}</p>
              <p className="text-sm text-gray-600">Calories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{todayNutrition.totalProtein}g</p>
              <p className="text-sm text-gray-600">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{todayNutrition.totalCarbs}g</p>
              <p className="text-sm text-gray-600">Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{todayNutrition.totalFat}g</p>
              <p className="text-sm text-gray-600">Fat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isScanning}
        >
          <Camera className="w-4 h-4 mr-2" />
          {isScanning ? 'Scanning...' : 'Scan Food'}
        </Button>
        
        <Dialog open={showAddFood} onOpenChange={setShowAddFood}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 border-gray-300 text-gray-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Manually
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Food Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Food Name</Label>
                <Input
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  placeholder="e.g., Apple, Chicken Breast"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Calories</Label>
                  <Input
                    type="number"
                    value={newFood.calories}
                    onChange={(e) => setNewFood({ ...newFood, calories: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Protein (g)</Label>
                  <Input
                    type="number"
                    value={newFood.protein}
                    onChange={(e) => setNewFood({ ...newFood, protein: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Carbs (g)</Label>
                  <Input
                    type="number"
                    value={newFood.carbs}
                    onChange={(e) => setNewFood({ ...newFood, carbs: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Fat (g)</Label>
                  <Input
                    type="number"
                    value={newFood.fat}
                    onChange={(e) => setNewFood({ ...newFood, fat: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={handleAddFood} className="w-full">
                Add Food
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleScanFood}
        style={{ display: 'none' }}
      />

      {/* Scanned Food Dialog */}
      {scannedFood && (
        <Dialog open={!!scannedFood} onOpenChange={() => setScannedFood(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Scanned Food</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{scannedFood.name}</h3>
                <p className="text-gray-600">{scannedFood.quantity} {scannedFood.unit}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>Calories: {scannedFood.calories}</div>
                <div>Protein: {scannedFood.protein}g</div>
                <div>Carbs: {scannedFood.carbs}g</div>
                <div>Fat: {scannedFood.fat}g</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddScannedFood} className="flex-1">
                  Add to Diary
                </Button>
                <Button variant="outline" onClick={() => setScannedFood(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Food List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Today's Foods</h2>
        {todayNutrition.foods.map((food) => (
          <Card key={food.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{food.name}</h3>
                  <p className="text-sm text-gray-600">{food.quantity} {food.unit}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {food.calories} cal • {food.protein}g protein • {food.carbs}g carbs • {food.fat}g fat
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFood(food.id, currentDate)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {todayNutrition.foods.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No foods logged today. Start by scanning or adding food!
          </div>
        )}
      </div>
    </div>
  );
}