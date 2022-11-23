import { ComponentProps, ReactNode, useEffect, useState } from "react";
import { styled, theme } from "./stitches";

import { ConnectModal } from "./ConnectModal";
import { useWallet } from "@mysten/wallet-adapter-react";

const Button = styled("button", {
  cursor: "pointer",
  border: "none",
  borderRadius: "$button",
  fontFamily: "$sans",
  fontWeight: "$button",
  fontSize: "$sm",

  variants: {
    size: {
      md: {
        padding: "$2 $4",
      },
      lg: {
        padding: "$4 $6",
      },
    },
    color: {
      primary: {
        backgroundColor: "$brand",
        color: "$textOnBrand",
        "&:hover": {
          backgroundColor: "$brandAccent",
        },
        boxShadow: "$button",
      },
      secondary: {
        backgroundColor: "transparent",
        border: "1px solid $secondary",
        color: "$secondaryAccent",
      },
      connected: {
        boxShadow: "$button",
        backgroundColor: "$background",
        color: "$textDark",
      },
    },
  },
  defaultVariants: {
    size: "md",
  },
});

interface ConnectButtonProps extends ComponentProps<typeof Button> {
  connectText?: ReactNode;
}

export function ConnectButton({
  connectText = "Connect Wallet",
  ...props
}: ConnectButtonProps) {
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  const { connected, getAccounts, disconnect } = useWallet();

  useEffect(() => {
    if (!connected) {
      setAccount(null);
    } else {
      getAccounts()
        .then((accounts) => setAccount(accounts[0]))
        .catch((e) => {
          console.warn("Error getting accounts");
        });
    }
  }, [connected]);

  return (
    <div className={theme}>
      {account ? (
        <Button color="connected" size="lg" onClick={() => disconnect()}>
          {`${account.slice(0, 4)}...${account.slice(-4)}`}
        </Button>
      ) : (
        <Button
          color="primary"
          size="lg"
          onClick={() => setOpen(true)}
          {...props}
        >
          {connectText}
        </Button>
      )}

      <ConnectModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
