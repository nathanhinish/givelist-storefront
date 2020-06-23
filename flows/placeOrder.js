import { placeOrderMutation } from "hooks/orders/placeOrder.gql";
import { shopAddressesQuery } from "../hooks/shop/queries.gql";
import { get } from "lodash";
import Router from "translations/i18nRouter";

async function getShopAddress(client, shop) {
  const {
    data: {
      shopAddresses: { addressBook: addresses },
    },
  } = await client.query({
    query: shopAddressesQuery,
    variables: {
      shopId: shop._id,
    },
  });

  if (addresses.length === 0) {
    throw new Error("Shop has no addresses available");
  }

  return addresses[0];
}

function handleShippingAddressResult(result) {
  const {
    data: {
      setShippingAddressOnCart: { cart },
    },
  } = result;

  const {
    checkout: { fulfillmentGroups },
  } = cart;
  if (fulfillmentGroups.length === 0) {
    throw new Error("There are no fulfillment groups in this cart");
  }

  const availableFulfillmentOptions = fulfillmentGroups[0].availableFulfillmentOptions;
  if (availableFulfillmentOptions.length === 0) {
    throw new Error("There are no available fulfillment options for this order");
  }

  return {
    cart,
    fulfillmentGroup: fulfillmentGroups[0],
    fulfillmentOption: availableFulfillmentOptions[0],
  };
}

function handleFulfillmentMethodResult(result) {
  const {
    data: {
      selectFulfillmentOptionForGroup: { cart },
    },
  } = result;
  return { cart };
}

export default async function placeOrder({
  client,
  result: { details },
  cartStore,
  cart,
  shop,
  checkoutMutations,
  clearAuthenticatedUsersCart,
}) {
  const cartId = cartStore.hasAccountCart ? cartStore.accountCartId : cartStore.anonymousCartId;
  const { onSetFulfillmentOption, onSetShippingAddress } = checkoutMutations;
  const orderEmailAddress =
    get(details, "payer.email_address") || get(cart, "account.emailRecords[0].address") || (cart ? cart.email : null);
  const shopAddress = await getShopAddress(client, shop);

  const { fulfillmentGroup, fulfillmentOption } = handleShippingAddressResult(await onSetShippingAddress(shopAddress));

  const { cart: updatedCart } = handleFulfillmentMethodResult(
    await onSetFulfillmentOption({
      fulfillmentGroupId: fulfillmentGroup._id,
      fulfillmentMethodId: fulfillmentOption.fulfillmentMethod._id,
    })
  );

  const {checkout} = updatedCart;

  const fulfillmentGroups = checkout.fulfillmentGroups.map((group) => {
    const { data } = group;
    const { selectedFulfillmentOption } = group;

    const items = cart.items.map((item) => ({
      addedAt: item.addedAt,
      price: item.price.amount,
      productConfiguration: item.productConfiguration,
      quantity: item.quantity,
    }));

    return {
      data,
      items,
      selectedFulfillmentMethodId: selectedFulfillmentOption.fulfillmentMethod._id,
      shopId: group.shop._id,
      totalPrice: checkout.summary.total.amount,
      type: group.type,
    };
  });

  const order = {
    cartId,
    currencyCode: checkout.summary.total.currency.code,
    email: orderEmailAddress,
    fulfillmentGroups,
    shopId: updatedCart.shop._id,
  };

  const { id: transactionId, payer, purchase_units: units } = details;
  const fullName = `${payer.name.given_name} ${payer.name.surname}`;
  const billingAddress = {
    address1: payer.address.address_line_1,
    address2: payer.address.address_line_2,
    city: payer.address.admin_area_2,
    region: payer.address.admin_area_1,
    country: payer.address.country_code,
    postal: payer.address.postal_code,
    fullName: fullName,
    phone: payer.phone.phone_number.national_number,
  };

  const payments = units.map((unit) => {
    return {
      method: "paypal",
      amount: parseFloat(unit.amount.value),
      billingAddress: {
        ...billingAddress,
      },
      data: {
        transactionId,
        fullName
      },
    };
  });
  try {
    const { data } = await client.mutate({
      mutation: placeOrderMutation,
      variables: {
        input: {
          order,
          payments,
        },
      },
    });

    // Placing the order was successful, so we should clear the
    // anonymous cart credentials from cookie since it will be
    // deleted on the server.
    cartStore.clearAnonymousCartCredentials();
    clearAuthenticatedUsersCart();

    // Also destroy the collected and cached payment input
    cartStore.resetCheckoutPayments();

    const {
      placeOrder: { orders, token },
    } = data;

    // Send user to order confirmation page
    console.info(`/checkout/order?orderId=${orders[0].referenceId}${token ? `&token=${token}` : ""}`);
    Router.push(`/checkout/order?orderId=${orders[0].referenceId}${token ? `&token=${token}` : ""}`);
  } catch (error) {
    console.info(error);
    // if (this._isMounted) {
    //   this.setState({
    //     hasPaymentError: true,
    //     isPlacingOrder: false,
    //     actionAlerts: {
    //       3: {
    //         alertType: "error",
    //         title: "Payment method failed",
    //         message: error.toString().replace("Error: GraphQL error:", "")
    //       }
    //     }
    //   });
    // }
  }
}
