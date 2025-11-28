<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
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

        } catch (RequestException $e) {
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
        } catch (GuzzleException $e) {
            Log::error('PayMongo Create Payment Intent Error', [
                'message' => $e->getMessage()
            ]);

            throw new \Exception('Failed to create payment intent: ' . $e->getMessage());
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

        } catch (RequestException $e) {
            $errorBody = null;

            if ($e->hasResponse()) {
                $errorBody = $e->getResponse()->getBody()->getContents();
            }

            Log::error('PayMongo Create Payment Method Error', [
                'message' => $e->getMessage(),
                'error_response' => $errorBody
            ]);

            throw new \Exception('Invalid payment details: ' . ($errorBody ?? $e->getMessage()));
        } catch (GuzzleException $e) {
            Log::error('PayMongo Create Payment Method Error', [
                'message' => $e->getMessage()
            ]);

            throw new \Exception('Invalid payment details: ' . $e->getMessage());
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

        } catch (RequestException $e) {
            $errorBody = null;

            if ($e->hasResponse()) {
                $errorBody = $e->getResponse()->getBody()->getContents();
            }

            Log::error('PayMongo Attach Payment Error', [
                'message' => $e->getMessage(),
                'error_response' => $errorBody
            ]);

            throw new \Exception('Payment processing failed: ' . ($errorBody ?? $e->getMessage()));
        } catch (GuzzleException $e) {
            Log::error('PayMongo Attach Payment Error', [
                'message' => $e->getMessage()
            ]);

            throw new \Exception('Payment processing failed: ' . $e->getMessage());
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

/**
 * Create a refund for a payment intent
 *
 * @param string $paymentIntentId The payment intent ID to refund
 * @param float|null $amount Amount to refund in PHP (null for full refund)
 * @param string $reason Reason for refund: 'duplicate', 'fraudulent', 'requested_by_customer'
 * @param string|null $notes Additional notes about the refund
 * @return array The refund response from PayMongo
 */
public function createRefund($paymentIntentId, $amount = null, $reason = 'requested_by_customer', $notes = null)
{
    try {
        // Step 1: Retrieve the payment intent to get the payment ID
        Log::info('Retrieving payment intent to get payment ID', [
            'payment_intent_id' => $paymentIntentId
        ]);

        $paymentIntent = $this->retrievePaymentIntent($paymentIntentId);

        // Get the payment ID from the payment intent
        $payments = $paymentIntent['data']['attributes']['payments'] ?? [];

        if (empty($payments)) {
            throw new \Exception('No payment found for this payment intent');
        }

        // Get the first payment ID and payment source details
        $payment = $payments[0];
        $paymentId = $payment['id'] ?? null;

        if (!$paymentId) {
            throw new \Exception('Payment ID not found in payment intent');
        }

        // Extract payment source details for the refund confirmation
        $paymentSource = $payment['attributes']['source'] ?? [];
        $sourceType = $paymentSource['type'] ?? null;

        $paymentDetails = [];
        if ($sourceType === 'card') {
            $paymentDetails = [
                'type' => 'card',
                'brand' => $paymentSource['brand'] ?? 'Unknown',
                'last4' => $paymentSource['last4'] ?? '****',
            ];
        } elseif ($sourceType === 'gcash') {
            $paymentDetails = [
                'type' => 'gcash',
            ];
        } elseif ($sourceType === 'paymaya') {
            $paymentDetails = [
                'type' => 'paymaya',
            ];
        } elseif ($sourceType === 'grab_pay') {
            $paymentDetails = [
                'type' => 'grab_pay',
            ];
        }

        Log::info('Found payment ID for refund', [
            'payment_intent_id' => $paymentIntentId,
            'payment_id' => $paymentId,
            'payment_details' => $paymentDetails
        ]);

        // Step 2: Create the refund using the payment ID
        $payload = [
            'data' => [
                'attributes' => [
                    'payment_id' => $paymentId,  // Use payment_id instead of payment_intent
                    'reason' => $reason,
                ]
            ]
        ];

        // If amount is specified, convert to centavos
        if ($amount !== null) {
            $payload['data']['attributes']['amount'] = (int)($amount * 100);
        }

        // Add notes if provided
        if ($notes !== null) {
            $payload['data']['attributes']['notes'] = $notes;
        }

        Log::info('Creating PayMongo refund', [
            'payment_id' => $paymentId,
            'amount' => $amount,
            'reason' => $reason,
            'payload' => $payload
        ]);

        $response = $this->client->post('refunds', [
            'json' => $payload
        ]);

        $result = json_decode($response->getBody()->getContents(), true);

        Log::info('PayMongo refund created successfully', [
            'refund_id' => $result['data']['id'] ?? 'unknown',
            'status' => $result['data']['attributes']['status'] ?? 'unknown',
            'amount' => $result['data']['attributes']['amount'] ?? 0
        ]);

        // Add payment details to the result for use in emails
        $result['payment_details'] = $paymentDetails;

        return $result;

    } catch (RequestException $e) {
        $errorBody = null;
        $statusCode = null;

        if ($e->hasResponse()) {
            $statusCode = $e->getResponse()->getStatusCode();
            $errorBody = $e->getResponse()->getBody()->getContents();
        }

        Log::error('PayMongo Create Refund Error', [
            'payment_intent_id' => $paymentIntentId,
            'message' => $e->getMessage(),
            'status_code' => $statusCode,
            'error_response' => $errorBody
        ]);

        throw new \Exception('Failed to create refund: ' . ($errorBody ?? $e->getMessage()));
    } catch (GuzzleException $e) {
        Log::error('PayMongo Create Refund Error', [
            'payment_intent_id' => $paymentIntentId,
            'message' => $e->getMessage()
        ]);

        throw new \Exception('Failed to create refund: ' . $e->getMessage());
    } catch (\Exception $e) {
        Log::error('Refund processing error', [
            'payment_intent_id' => $paymentIntentId,
            'error' => $e->getMessage()
        ]);
        throw $e;
    }
}

/**
 * Retrieve refund details
 *
 * @param string $refundId The refund ID
 * @return array The refund details
 */
public function retrieveRefund($refundId)
{
    try {
        Log::info('Retrieving PayMongo refund', ['refund_id' => $refundId]);

        $response = $this->client->get("refunds/{$refundId}");
        $result = json_decode($response->getBody()->getContents(), true);

        Log::info('PayMongo refund retrieved', [
            'refund_id' => $refundId,
            'status' => $result['data']['attributes']['status'] ?? 'unknown'
        ]);

        return $result;

    } catch (GuzzleException $e) {
        Log::error('PayMongo Retrieve Refund Error', [
            'refund_id' => $refundId,
            'message' => $e->getMessage()
        ]);
        throw new \Exception('Failed to retrieve refund: ' . $e->getMessage());
    }
}
}