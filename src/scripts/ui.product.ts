import { markket  } from '../../markket.config';

/**
 * Allows to click on a thumbnail and change the main product image
 */
export const ProductSlideshow = function () {

  const buttons = document.querySelectorAll("[data-astro-image]");

  buttons.forEach(button => {
    button.addEventListener("click", e => {
      const jsonData = (e.target as Element)?.getAttribute('data-astro-image');

      try {
        const jsonObject = JSON.parse(jsonData || '');
        const heroImage = document.querySelector(".hero-image");

        if (heroImage) {
          (heroImage as HTMLImageElement).src = jsonObject.url;
        }

      } catch (error) {
        console.error("Error parsing JSON", error);
      }
    });
  });
};

export type Price = {
  amount?: number,
  currency: string,
  product?: string,
  unit_amount?: string,
  Price?: string,
  quantity?: number,
  STRIPE_ID?: string,
  Description?: string,
};

export type PaymentLinkOptions = {
  totalPrice: number,
  product: string,
  prices: Price[],
  includes_shipping: boolean,
  stripe_test: boolean,
  store_id?: string,
};

/**
 * Sends a POST request to the API, to request a unique stripe payment link
 * We redirect buyers there to complete the purchase
 * @TODO move to markket-next and import via npm
 *
 * @returns {Promise<Response>} Payment link
 */
export const createPaymentLink = async (options: PaymentLinkOptions, isTest: boolean = true): Promise<Response> => {
  console.log("Creating payment link", { options, isTest });

  const prices = options.prices;

  const body = {
    prices,
    total: options.totalPrice,
    product: options.product,
    action: 'stripe.link',
    includes_shipping: options.includes_shipping,
    stripe_test: options.stripe_test,
    store_id: options.store_id,
  };

  const request = await fetch(new URL(`/api/markket`, markket.api_url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const response = await request.json();

  console.log("Payment link", { request, response });

  const url = response?.data?.link?.response?.url;

  if (request.ok && url) {
    window.location.href = url;
  }

  return request;
};
