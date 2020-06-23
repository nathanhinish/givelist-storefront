import { useApolloClient } from "@apollo/client";
import Dialog from "@material-ui/core/Dialog";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Layout from "components/Layout";
import PageLoading from "components/PageLoading";
import withCart from "containers/cart/withCart";
import inject from "hocs/inject";
import useStores from "hooks/useStores";
import { withApollo } from "lib/apollo/withApollo";
import PropTypes from "prop-types";
import React, { useState } from "react";
import Helmet from "react-helmet";
import fetchPrimaryShop from "staticUtils/shop/fetchPrimaryShop";
import fetchTranslations from "staticUtils/translations/fetchTranslations";
import { locales } from "translations/config";
import Router from "translations/i18nRouter";
import GivelistCartItems from "../../components/Givelist/CartItems/index";
import GivelistCartSummary from "../../components/Givelist/CartSummary/index";
import placeOrder from "../../flows/placeOrder";
import useCart from "../../hooks/cart/useCart";

const useStyles = makeStyles((theme) => ({
  cartEmptyMessageContainer: {
    margin: "80px 0",
  },
  checkoutButtonsContainer: {
    backgroundColor: theme.palette.reaction.black02,
    padding: theme.spacing(2),
  },
  customerSupportCopy: {
    paddingLeft: `${theme.spacing(4)}px !important`,
  },
  phoneNumber: {
    fontWeight: theme.typography.fontWeightBold,
  },
  title: {
    fontWeight: theme.typography.fontWeightRegular,
    marginTop: "1.6rem",
    marginBottom: "3.1rem",
  },
  itemWrapper: {
    borderTop: theme.palette.borders.default,
    borderBottom: theme.palette.borders.default,
  },
}));

function CartPage(props) {
  const { cart, shop, hasMoreCartItems, loadMoreCartItems, onRemoveCartItems, onChangeCartItemsQuantity } = props;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  console.info(clientId);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const { cartStore } = useStores();
  const { checkoutMutations, clearAuthenticatedUsersCart } = useCart();
  const apolloClient = useApolloClient();
  const classes = useStyles();

  // when a user has no item in cart in a new session, props.cart is null
  // when the app is still loading, props.cart is undefined
  if (typeof cart === "undefined") return <PageLoading delay={0} />;

  function handleItemQuantityChange(quantity, cartItemId) {
    onChangeCartItemsQuantity({ quantity, cartItemId });
  }

  async function handlePlaceOrder(result) {
    setIsPlacingOrder(true);
    await placeOrder({
      client: apolloClient,
      result,
      cartStore,
      cart,
      shop,
      checkoutMutations,
      clearAuthenticatedUsersCart,
    });
    setIsPlacingOrder(false);
  }

  let overlay = null;
  if (isPlacingOrder) {
    overlay = (
      <Dialog fullScreen disableBackdropClick={true} disableEscapeKeyDown={true} open={isPlacingOrder}>
        <PageLoading delay={0} message="Placing your order..." />
      </Dialog>
    );
  }

  return (
    <Layout shop={shop}>
      <Helmet
        title={`Cart | ${shop && shop.name}`}
        meta={[{ name: "description", content: shop && shop.description }]}
      />
      <section>
        <Typography className={classes.title} variant="h6" align="center">
          Shopping Cart
        </Typography>
        <Grid container spacing={3}>
          <GivelistCartItems
            cart={cart}
            classes={classes}
            hasMoreCartItems={hasMoreCartItems}
            loadMoreCartItems={loadMoreCartItems}
            onItemQuantityChange={handleItemQuantityChange}
            onRemoveItem={onRemoveCartItems}
            onClickExit={() => Router.push("/")}
          />
          <GivelistCartSummary
            cart={cart}
            shop={shop}
            classes={classes}
            clientId={clientId}
            onPlaceOrder={handlePlaceOrder}
          />
          {/* <Grid className={classes.customerSupportCopy} item>
            <Typography paragraph variant="caption">
              Have questions? call <span className={classes.phoneNumber}>1.800.555.5555</span>
            </Typography>
            <Typography paragraph variant="caption">
              <Link href="#">Shipping information</Link>
            </Typography>
            <Typography paragraph variant="caption">
              <Link href="#">Return policy</Link>
            </Typography>
          </Grid> */}
        </Grid>
      </section>
    </Layout>
  );
}

CartPage.propTypes = {
  cart: PropTypes.shape({
    totalItems: PropTypes.number,
    items: PropTypes.arrayOf(PropTypes.object),
    checkout: PropTypes.shape({
      fulfillmentTotal: PropTypes.shape({
        displayAmount: PropTypes.string,
      }),
      itemTotal: PropTypes.shape({
        displayAmount: PropTypes.string,
      }),
      taxTotal: PropTypes.shape({
        displayAmount: PropTypes.string,
      }),
    }),
  }),
  classes: PropTypes.object,
  hasMoreCartItems: PropTypes.bool,
  loadMoreCartItems: PropTypes.func,
  onChangeCartItemsQuantity: PropTypes.func,
  onRemoveCartItems: PropTypes.func,
  shop: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
  }),
};

/**
 *  Static props for the cart route
 *
 * @param {String} lang - the shop's language
 * @returns {Object} props
 */
export async function getStaticProps({ params: { lang } }) {
  return {
    props: {
      ...(await fetchPrimaryShop(lang)),
      ...(await fetchTranslations(lang, ["common"])),
    },
  };
}

/**
 *  Static paths for the cart route
 *
 * @returns {Object} paths
 */
export async function getStaticPaths() {
  return {
    paths: locales.map((locale) => ({ params: { lang: locale } })),
    fallback: false,
  };
}

export default withApollo()(withCart(inject("uiStore")(CartPage)));
