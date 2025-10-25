const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border py-4">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm text-muted-foreground">
          © {currentYear} Fresh Flow Store. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
