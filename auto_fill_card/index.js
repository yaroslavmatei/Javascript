document.addEventListener("DOMContentLoaded", () => {
  // Function to initialize payment form to reuse it after destroy
  function initPaymentForm() {
    const mrOrderInput = document.getElementById("mdOrder");
    mrOrderInput.classList.remove("invalid");
    if (!/(\w+-){3,10}\w+/g.test(mrOrderInput.value)) {
      mrOrderInput.classList.add("invalid");
      return;
    }

    // Initialization of Web SDK. A required mdOrder (order ID) is needed.
    initPayment(mrOrderInput.value);
  }

  document.formRunTest.addEventListener("submit", function (e) {
    e.preventDefault();
    // Initialize payment form
    initPaymentForm();
  });

  let webSdkFormWithoutBindings;
  // Array of additional field objects with field id, validation template and valid input characters
  const mandatoryFieldsWithoutBinding = [
    {
        id: '#cardholder',
        template: /^[a-zA-Z '`.\-]{4,24}$/,
        replace: /[^a-zA-Z ' \-`.]/g,
    },
    {
        id: '#mobile',
        template: /^\+?[1-9][0-9]{7,14}$/,
        replace: /[^0-9\+]/g,
    },
    {
        id: '#email',
        template: /^[a-zA-Z0-9._-]{1,64}@([a-zA-Z0-9.-]{2,255})\.[a-zA-Z]{2,255}$/,
        replace: /[^a-zA-Z0-9@._-]/g,
    }
  ]

  function initPayment(mdOrder) {
    webSdkFormWithoutBindings = new window.PaymentForm({
      mdOrder: mdOrder,
      onFormValidate: () => {},
      language: "en",
      containerClassName: "field-container",
      autoFocus: true,
      showPanIcon: true,
      panIconStyle: {
        height: "16px",
        top: "calc(50% - 8px)",
        right: "8px",
      },
      fields: {
        pan: {
          container: document.querySelector("#pan"),
        },
        expiry: {
          container: document.querySelector("#expiry"),
        },
        cvc: {
          container: document.querySelector("#cvc"),
        },
      },
      styles: {
        base: {
          padding: "0px 16px",
          color: "black",
          fontSize: "18px",
        },
        invalid: {
          color: "red",
        },
        placeholder: {
          base: {
            color: "gray",
          },
          focus: {
            color: "transparent",
          },
        },
      },
    });

    // Action after initialization
    webSdkFormWithoutBindings.init().then(() => {
      document.querySelector(".payment-form-loader").classList.remove("payment-form-loader--active");
    })
    .finally(() => {
      // Validation and characters replacement on fields input
      mandatoryFieldsWithBinding.forEach(item => {
        const field = document.querySelector(item.id)
        field.closest(".additional-field").style.display = '';
        field.addEventListener('input', () => {
            let inputValue = field.querySelector('input')
            inputValue.value = item.replace ? inputValue.value.replace(item.replace,'') : inputValue.value;
            if (item.id.includes("#cardholder")) {
                inputValue.value = inputValue.value.toUpperCase()
            }
            if (item.template) {
                // The CSS class ".additional-field-invalid" is used to display invalid fields
                if (item.template.test(inputValue.value)) {
                    field.classList.remove("additional-field-invalid")
                } else {
                    field.classList.add("additional-field-invalid")
                }
            }
        })
      })
    })
  }

  // Pay handler
  document.querySelector("#pay").addEventListener("click", () => {
    const payButton = document.querySelector("#pay");

    // Make the "Pay" button inactive to avoid double payments
    payButton.disabled = true;

    // Show the loader to the user
    const spinnerEl = document.querySelector("#pay-spinner");
    spinnerEl.classList.remove("visually-hidden");

    // Hide the error container
    const errorEl = document.querySelector("#error");
    errorEl.classList.add("visually-hidden");
    // Checking of additional fields validation before Payment
    if (document.querySelectorAll('.additional-field-invalid').length) {
      errorEl.innerHTML = "Form is not valid";
      errorEl.classList.remove('visually-hidden');
      spinnerEl.classList.add('visually-hidden');
      return
    }

    // Start payment
    webSdkFormWithoutBindings
      .doPayment({
        // Additional parameters
        email: document.querySelector('#email input').value,
        phone: document.querySelector('#mobile input').value,
        cardholderName: document.querySelector('#cardholder input').value,
        jsonParams: { size: "L" },
      })
      .then((result) => {
        console.log("result", result);
      })
      .catch((e) => {
        // Execute on error
        errorEl.innerHTML = e.message;
        errorEl.classList.remove("visually-hidden");
      })
      .finally(() => {
        // Execute in any case. For example, make the "Pay" button active again.
        payButton.disabled = false;
        spinnerEl.classList.add("visually-hidden");
      });
  });
});