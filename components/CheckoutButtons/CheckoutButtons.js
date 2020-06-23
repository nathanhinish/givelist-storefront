import PropTypes from "prop-types";
import React from "react";
import { PayPalButton } from "react-paypal-button-v2";

export default function CheckoutButtons(props) {
  const { amount, currency, clientId, onCreateOrder, onSuccess, onCancel } = props;

  function handleSuccess(details, data) {
    onSuccess({ details, data });
  }

  function handleError(err) {
    console.info("handle error", err);
  }

  return (
    <div className="checkout-buttons">
      <PayPalButton
        amount={amount}
        currency={currency}
        shippingPreference="NO_SHIPPING"
        clientId={clientId}
        onSuccess={handleSuccess}
        createOrder={onCreateOrder}
        catchError={handleError}
        onCancel={onCancel}
      />
    </div>
  );
}

CheckoutButtons.propTypes = {
  amount: PropTypes.number,
  currency: PropTypes.string,
  clientId: PropTypes.string,
  onCreateOrder: PropTypes.func,
  onSuccess: PropTypes.func,
};
