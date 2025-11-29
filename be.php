<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$apiKey = "f23867e16b9e4200cc939e97c380a5f3"; 

$city = isset($_GET['city']) ? urlencode($_GET['city']) : 'Jakarta';

$currentUrl = "https://api.openweathermap.org/data/2.5/weather?q={$city}&appid={$apiKey}&units=metric&lang=id";
$currentRaw = @file_get_contents($currentUrl);

$forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?q={$city}&appid={$apiKey}&units=metric&lang=id";
$forecastRaw = @file_get_contents($forecastUrl);

if ($currentRaw === FALSE || $forecastRaw === FALSE) {
    http_response_code(404);
    echo json_encode([
        "status" => "error", 
        "message" => "Kota tidak ditemukan atau API Key bermasalah."
    ]);
    exit;
}

$currentData = json_decode($currentRaw, true);
$forecastData = json_decode($forecastRaw, true);

$formattedData = [
    "status" => "success",
    "city" => $currentData['name'], 
    "data" => [
        "current" => [
            "temp" => round($currentData['main']['temp']),
            "humidity" => $currentData['main']['humidity'],
            "wind" => round($currentData['wind']['speed'] * 3.6), // Convert m/s ke km/h
            "desc" => ucwords($currentData['weather'][0]['description']),
            "icon" => mapIcon($currentData['weather'][0]['icon']) // Panggil fungsi helper di bawah
        ],
        "forecast" => []
    ]
];

$addedDates = [];

foreach ($forecastData['list'] as $f) {
    $dateOnly = substr($f['dt_txt'], 0, 10);
    
    if (!in_array($dateOnly, $addedDates) && strpos($f['dt_txt'], "12:00:00") !== false) {
        
        $addedDates[] = $dateOnly;
        $timestamp = strtotime($dateOnly);
        $days = ['Sun' => 'Minggu', 'Mon' => 'Senin', 'Tue' => 'Selasa', 'Wed' => 'Rabu', 'Thu' => 'Kamis', 'Fri' => 'Jumat', 'Sat' => 'Sabtu'];
        $dayEnglish = date('D', $timestamp);
        $dayName = $days[$dayEnglish];

        $formattedData['data']['forecast'][] = [
            "day" => $dayName,
            "min" => round($f['main']['temp_min']), 
            "max" => round($f['main']['temp_max']),
            "icon" => mapIcon($f['weather'][0]['icon'])
        ];
    }
}

$formattedData['data']['forecast'] = array_slice($formattedData['data']['forecast'], 0, 5);

echo json_encode($formattedData);


function mapIcon($code) {
    
    if (strpos($code, '01') !== false) return 'sun';
    if (strpos($code, '02') !== false) return 'cloud';
    if (strpos($code, '03') !== false) return 'cloud';
    if (strpos($code, '04') !== false) return 'cloud';
    if (strpos($code, '09') !== false) return 'rain';
    if (strpos($code, '10') !== false) return 'rain';
    if (strpos($code, '11') !== false) return 'storm';
    if (strpos($code, '13') !== false) return 'snow';
    if (strpos($code, '50') !== false) return 'mist';
    
    return 'cloud'; // Default
}
?>