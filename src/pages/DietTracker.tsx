import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Camera, Plus, Trash2, Calendar } from 'lucide-react';
import { useDietStore, FoodItem } from '@/stores/useDietStore';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';

export default function DietTracker() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatDateWithOptions, getText } = useSettings();
  const { addFood, removeFood, getDailyNutrition, scanFood } = useDietStore();
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
          toast({
            title: "Food Recognized!",
            description: `Detected: ${scannedResult.name} with ${scannedResult.calories} calories`,
            duration: 3000,
          });
        } else {
          toast({
            title: "Recognition Failed",
            description: "Couldn't identify the food. You can add it manually.",
            variant: "destructive",
            duration: 3000,
          });
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
      toast({
        title: "Food Added!",
        description: `${scannedFood.name} has been added to your diary`,
        duration: 2000,
      });
      setScannedFood(null);
    }
  };

  // Get daily calorie data for the past 7 days
  const getDailyCalorieData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayData = getDailyNutrition(dateString);
      days.push({
        date: dateString,
        displayDate: formatDateWithOptions(date, { weekday: 'short', month: 'short', day: 'numeric' }),
        calories: dayData.totalCalories,
        isToday: dateString === currentDate
      });
    }
    return days;
  };

  const dailyCalorieData = getDailyCalorieData();

  return (
    <div className="min-h-screen p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getText('diet_tracker')}</h1>
          <p className="text-muted-foreground">{formatDateWithOptions(new Date())}</p>
        </div>
      </div>

      {/* Daily Summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Today's Nutrition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{todayNutrition.totalCalories}</p>
              <p className="text-sm text-muted-foreground">{getText('calories')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-500">{todayNutrition.totalProtein}g</p>
              <p className="text-sm text-muted-foreground">{getText('protein')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{todayNutrition.totalCarbs}g</p>
              <p className="text-sm text-muted-foreground">{getText('carbs')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{todayNutrition.totalFat}g</p>
              <p className="text-sm text-muted-foreground">{getText('fat')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Calorie History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Weekly Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          {dailyCalorieData.map((day) => (
            <Dialog key={day.date}>
              <DialogTrigger asChild>
                <Card 
                  className={`border-2 transition-all duration-200 hover:scale-105 cursor-pointer ${
                    day.isToday 
                      ? 'border-primary bg-primary/5' 
                      : day.calories > 0 
                        ? 'border-green-500/30 bg-green-500/5' 
                        : 'border-muted bg-card'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-center text-foreground">
                      {day.displayDate}
                      {day.isToday && (
                        <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                          Today
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {day.calories}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getText('calories')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {day.calories > 0 ? 'Logged' : 'No data'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Food Groups - {day.displayDate}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {(() => {
                    const dayNutrition = getDailyNutrition(day.date);
                    const dayFoods = dayNutrition.foods;
                    
                    if (dayFoods.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No food logged for this day</p>
                        </div>
                      );
                    }

                    // Group foods by food type (based on name patterns)
                    const getFoodCategory = (foodName: string) => {
                      const name = foodName.toLowerCase();
                      if (name.includes('chicken') || name.includes('beef') || name.includes('fish') || name.includes('meat') || name.includes('protein')) return 'Protein';
                      if (name.includes('rice') || name.includes('bread') || name.includes('pasta') || name.includes('carb') || name.includes('grain')) return 'Carbohydrates';
                      if (name.includes('apple') || name.includes('banana') || name.includes('fruit') || name.includes('berry') || name.includes('orange')) return 'Fruits';
                      if (name.includes('broccoli') || name.includes('spinach') || name.includes('vegetable') || name.includes('lettuce') || name.includes('carrot')) return 'Vegetables';
                      if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || name.includes('dairy')) return 'Dairy';
                      if (name.includes('oil') || name.includes('butter') || name.includes('nuts') || name.includes('avocado')) return 'Fats';
                      return 'Other';
                    };

                    const foodGroups = dayFoods.reduce((groups: {[key: string]: FoodItem[]}, food) => {
                      const category = getFoodCategory(food.name);
                      if (!groups[category]) groups[category] = [];
                      groups[category].push(food);
                      return groups;
                    }, {});

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{dayNutrition.totalCalories}</div>
                            <div className="text-xs text-muted-foreground">Total Calories</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-emerald-500">{dayNutrition.totalProtein}g</div>
                            <div className="text-xs text-muted-foreground">{getText('protein')}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {Object.entries(foodGroups).map(([category, categoryFoods]) => (
                            <div key={category} className="p-3 bg-card border border-border rounded-lg">
                              <h4 className="font-semibold text-foreground mb-2">{category}</h4>
                              <div className="space-y-1">
                                {categoryFoods.map((food, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span className="text-foreground">{food.name}</span>
                                    <span className="text-muted-foreground">{food.calories} cal</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 pt-2 border-t border-border">
                                <div className="text-sm font-medium text-foreground">
                                  Total: {categoryFoods.reduce((sum, food) => sum + food.calories, 0)} calories
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
          disabled={isScanning}
        >
          <Camera className="w-4 h-4 mr-2" />
          {isScanning ? 'Scanning...' : 'Scan Food'}
        </Button>
        
        <Dialog open={showAddFood} onOpenChange={setShowAddFood}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Add Manually
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Food Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Food Name</Label>
                <Input
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  placeholder="e.g., Apple, Chicken Breast"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground">Calories</Label>
                  <Input
                    type="number"
                    value={newFood.calories || ''}
                    onChange={(e) => setNewFood({ ...newFood, calories: Number(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Protein (g)</Label>
                  <Input
                    type="number"
                    value={newFood.protein || ''}
                    onChange={(e) => setNewFood({ ...newFood, protein: Number(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Carbs (g)</Label>
                  <Input
                    type="number"
                    value={newFood.carbs || ''}
                    onChange={(e) => setNewFood({ ...newFood, carbs: Number(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Fat (g)</Label>
                  <Input
                    type="number"
                    value={newFood.fat || ''}
                    onChange={(e) => setNewFood({ ...newFood, fat: Number(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground">Quantity</Label>
                  <Input
                    type="number"
                    value={newFood.quantity || ''}
                    onChange={(e) => setNewFood({ ...newFood, quantity: Number(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Unit</Label>
                  <Input
                    value={newFood.unit}
                    onChange={(e) => setNewFood({ ...newFood, unit: e.target.value })}
                    placeholder="e.g., serving, cup, piece"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={handleAddFood} className="w-full" disabled={!newFood.name.trim()}>
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
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Scanned Food</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">{scannedFood.name}</h3>
                <p className="text-muted-foreground">{scannedFood.quantity} {scannedFood.unit}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-foreground">Calories: {scannedFood.calories}</div>
                <div className="text-foreground">Protein: {scannedFood.protein}g</div>
                <div className="text-foreground">Carbs: {scannedFood.carbs}g</div>
                <div className="text-foreground">Fat: {scannedFood.fat}g</div>
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
        <h2 className="text-lg font-semibold text-foreground">Today's Foods</h2>
        {todayNutrition.foods.map((food) => (
          <Card key={food.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{food.name}</h3>
                  <p className="text-sm text-muted-foreground">{food.quantity} {food.unit}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {food.calories} cal • {food.protein}g protein • {food.carbs}g carbs • {food.fat}g fat
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFood(food.id, currentDate)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {todayNutrition.foods.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No foods logged today. Start by scanning or adding food!
          </div>
        )}
      </div>
    </div>
  );
}