<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class PaymongoService
{
    private $client;
    private $secretKey;

    public function __construct()
    {
        $this->secretKey = config('services.paymongo.secret_key');
        
        Log::info('PaymongoService initialized', [
            'secret_key_exists' => !empty($this->secretKey),
            'secret_key_prefix' => substr($this->secretKey, 0, 7)
        ]);
        
        $this->client = new Client([
            'base_uri' => 'https://api.paymongo.com/v1/',
            'headers' => [
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'Authorization' => 'Basic ' . base64_encode($this->secretKey . ':'),
            ],
            'verify' => false, // Temporary fix for SSL certificate issue in development
        ]);
    }

    /**
     * Create a payment intent
     */
    public function createPaymentIntent($amount, $description, $metadata = [])
    {
        try {
            $amountInCentavos = (int) ($amount * 100);
            
            // Convert metadata values to strings (PayMongo requirement)
            $stringMetadata = [];
            foreach ($metadata as $key => $value) {
                $stringMetadata[$key] = (string) $value;
            }
            
            $payload = [
                'data' => [
                    'attributes' => [
                        'amount' => $amountInCentavos,
                        'currency' => 'PHP',
                        'description' => $description,
                        'statement_descriptor' => 'LegalKonect',
                        'payment_method_allowed' => ['card', 'gcash', 'paymaya'],
                        'metadata' => $stringMetadata,
                    ],
                ],
            ];

            Log::info('Creating PayMongo payment intent', [
                'amount' => $amount,
                'amount_centavos' => $amountInCentavos,
                'description' => $description,
                'payload' => $payload
            ]);

            $response = $this->client->post('payment_intents', [
                'json' => $payload,
            ]);

            $result = json_decode($response->getBody()->getContents(), true);
            
            Log::info('PayMongo payment intent created', [
                'payment_intent_id' => $result['data']['id'] ?? 'unknown'
            ]);

            return $result;

        } catch (GuzzleException $e) {
            $errorBody = null;
            $statusCode = null;
            
            if ($e->hasResponse()) {
                $statusCode = $e->getResponse()->getStatusCode();
                $errorBody = $e->getResponse()->getBody()->getContents();
            }

            Log::error('PayMongo Create Payment Intent Error', [
                'message' => $e->getMessage(),
                'status_code' => $statusCode,
                'error_response' => $errorBody
            ]);

            throw new \Exception('Failed to create payment intent: ' . ($errorBody ?? $e->getMessage()));
        }
    }

    /**
     * Create a payment method
     */
    public function createPaymentMethod($type, $details, $billing = null)
    {
        try {
            // Format card details properly for PayMongo
            $formattedDetails = [];
            
            if ($type === 'card' && isset($details['card_number'])) {
                $formattedDetails = [
                    'card_number' => (string) $details['card_number'],
                    'exp_month' => (int) $details['exp_month'],
                    'exp_year' => (int) $details['exp_year'],
                    'cvc' => (string) $details['cvc'],
                ];
            } else {
                $formattedDetails = $details;
            }

            $data = [
                'data' => [
                    'attributes' => [
                        'type' => $type,
                        'details' => $formattedDetails,
                    ],
                ],
            ];

            if ($billing) {
                $data['data']['attributes']['billing'] = $billing;
            }

            Log::info('Creating PayMongo payment method', [
                'type' => $type,
                'payload' => $data
            ]);

            $response = $this->client->post('payment_methods', [
                'json' => $data,
            ]);

            return json_decode($response->getBody()->getContents(), true);

        } catch (GuzzleException $e) {
            $errorBody = null;
            
            if ($e->hasResponse()) {
                $errorBody = $e->getResponse()->getBody()->getContents();
            }

            Log::error('PayMongo Create Payment Method Error', [
                'message' => $e->getMessage(),
                'error_response' => $errorBody
            ]);

            throw new \Exception('Invalid payment details: ' . ($errorBody ?? $e->getMessage()));
        }
    }

    /**
     * Attach payment method to payment intent
     */
    public function attachPaymentIntent($paymentIntentId, $paymentMethodId)
    {
        try {
            Log::info('Attaching payment method to intent', [
                'payment_intent_id' => $paymentIntentId,
                'payment_method_id' => $paymentMethodId
            ]);

            $response = $this->client->post("payment_intents/{$paymentIntentId}/attach", [
                'json' => [
                    'data' => [
                        'attributes' => [
                            'payment_method' => $paymentMethodId,
                            'return_url' => config('app.url') . '/payment/callback',
                        ],
                    ],
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);

        } catch (GuzzleException $e) {
            $errorBody = null;
            
            if ($e->hasResponse()) {
                $errorBody = $e->getResponse()->getBody()->getContents();
            }

            Log::error('PayMongo Attach Payment Error', [
                'message' => $e->getMessage(),
                'error_response' => $errorBody
            ]);

            throw new \Exception('Payment processing failed: ' . ($errorBody ?? $e->getMessage()));
        }
    }

    /**
     * Retrieve payment intent
     */
    public function retrievePaymentIntent($paymentIntentId)
    {
        try {
            $response = $this->client->get("payment_intents/{$paymentIntentId}");
            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            Log::error('PayMongo Retrieve Payment Intent Error: ' . $e->getMessage());
            throw new \Exception('Failed to retrieve payment');
        }
    }

    public function createSource($type, $amount, $metadata)
{
    try {
        $amountCentavos = (int)($amount * 100);
        
        Log::info('Creating PayMongo source', [
            'type' => $type,
            'amount' => $amount,
            'amount_centavos' => $amountCentavos
        ]);

        // Flatten metadata - PayMongo doesn't accept nested objects
        $flatMetadata = [];
        foreach ($metadata as $key => $value) {
            $flatMetadata[$key] = (string)$value; // Convert all to strings
        }

        $response = $this->client->post('sources', [
            'json' => [
                'data' => [
                    'attributes' => [
                        'type' => $type,
                        'amount' => $amountCentavos,
                        'currency' => 'PHP',
                       'redirect' => [
    'success' => env('APP_URL') . '/api/payment/source-callback',
    'failed' => env('FRONTEND_URL', 'http://localhost:3000') . '/appointments?payment=failed'
],
                        'billing' => [
                            'name' => 'Customer',
                            'email' => 'customer@example.com',
                            'phone' => '09123456789'
                        ],
                        'metadata' => $flatMetadata
                    ]
                ]
            ]
        ]);

        $result = json_decode($response->getBody(), true);
        
        Log::info('PayMongo source created', [
            'source_id' => $result['data']['id'] ?? 'unknown'
        ]);

        return $result;

    } catch (\Exception $e) {
        Log::error('PayMongo source creation failed: ' . $e->getMessage());
        throw $e;
    }
}

public function getSource($sourceId)
{
    $response = $this->client->get("sources/{$sourceId}");
    return json_decode($response->getBody(), true);
}

public function attachSourceToPaymentIntent($paymentIntentId, $sourceId)
{
    $response = $this->client->post("payment_intents/{$paymentIntentId}/attach", [
        'json' => [
            'data' => [
                'attributes' => [
                    'payment_method' => $sourceId
                ]
            ]
        ]
    ]);
    return json_decode($response->getBody(), true);
}
}