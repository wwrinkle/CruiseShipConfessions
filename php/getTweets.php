<?php
require_once ('codebird.php');
\Codebird\Codebird::setConsumerKey('[KEY]', '[SECRET]'); 
$cb = \Codebird\Codebird::getInstance();
$cb->setToken('[TOKEN]', '[TOKENSECRET]');
$params['count'] = 3200;
$tweets = (array) $cb->statuses_userTimeline($params);
echo json_encode($tweets);
?>