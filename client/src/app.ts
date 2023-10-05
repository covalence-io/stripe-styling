import {
    Stripe,
    StripeElements,
    loadStripe,
    Appearance,
} from '@stripe/stripe-js';
import { STRIPE_PUBLIC_KEY } from './ref';

(function () {
    const el = <HTMLElement>document.getElementById('payment');
    const btn = <HTMLButtonElement>document.getElementById('submit');
    const form = <HTMLFormElement>document.querySelector('form');
    const firstName = <HTMLInputElement>document.getElementById('first-name');
    const lastName = <HTMLInputElement>document.getElementById('last-name');
    const email = <HTMLInputElement>document.getElementById('email');
    const container = document.querySelector('.container');
    let stripe: Stripe;
    let elements: StripeElements;

    async function load(customer?: string) {
        if (!el) {
            return;
        }

        // const rprom = fetch(`/api/v1/users/paymentintent`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({
        //         amount: 1500,
        //     }),
        // });
        const rprom = fetch(`/api/v1/users/setupintent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer,
            }),
        });

        stripe = await loadStripe(STRIPE_PUBLIC_KEY) as Stripe;

        const res = await rprom;
        const data = await res.json();
        const appearance: Appearance = {
            theme: 'stripe',
            variables: {
                borderRadius: '6px',
                // colorDanger: 'purple',
            },
            rules: {
                '.Input': {
                    boxShadow: 'inset 0 0 0 1px rgb(209, 213, 219)',
                    border: 'none',
                    outline: 'none',
                    padding: '0.75em 1em',
                    color: '#444',
                },
                '.Input:focus': {
                    boxShadow: 'inset 0 0 0 2px #2563eb',
                },
            },
        };

        elements = stripe?.elements({
            clientSecret: data.clientSecret,
            loader: 'auto',
            appearance,
        });

        const payEl = elements?.create('payment', {
            layout: 'tabs',
            // defaultValues: {
            //     billingDetails: {
            //         name: '',
            //         email: '',
            //     },
            // },
        });

        payEl?.mount(el);
    }

    form?.addEventListener('submit', async (ev) => {
        ev.preventDefault();

        if (!email?.value) {
            alert('Please input an email address');
            return;
        }

        const post = await fetch(`/api/v1/users/customer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firstname: firstName?.value,
                lastname: lastName?.value,
                email: email?.value,
            }),
        });

        const resp = await post.json();

        if (resp.success) {
            form.classList.add('hide');
            container?.classList.remove('hide');
            load(resp.customer);
        } else {
            alert(`Error - ${resp.error}`);
        }
    });

    btn?.addEventListener('click', async () => {
        // const sResult = await stripe?.confirmPayment({
        //     elements,
        //     redirect: 'if_required',
        //     confirmParams: {
        //         return_url: 'http://localhost:3000',
        //     },
        // });
        const sResult = await stripe?.confirmSetup({
            elements,
            redirect: 'if_required',
            confirmParams: {
                return_url: 'http://localhost:3000',
            },
        });

        if (!!sResult?.error) {
            // alert(sResult.error.message);
            return;
        }

        const post = await fetch(`/api/v1/users/finishsetup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                setupintent: sResult?.setupIntent?.id,
            }),
        });

        const resp = await post.json();

        if (resp.success) {
            const success = document.querySelector('.success');

            if (!!container) {
                container.classList.add('hide');
            }

            if (!!success) {
                // success.textContent += ` ${sResult?.paymentIntent?.id}`;
                success.classList.remove('hide');
            }
        } else {
            alert(`Error - ${resp.error}`);
        }
    });
})();