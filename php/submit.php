<?php
require_once ('codebird.php');
\Codebird\Codebird::setConsumerKey('[KEY]', '[SECRET]'); 
$cb = \Codebird\Codebird::getInstance();
$cb->setToken('[TOKEN]', '[TOKENSECRET]');
$message = file_get_contents('php://input');
$reply = $cb->statuses_update('status=' . urlencode($message));
$response = array( 'success' => true );
echo json_encode( $response );
    ?>